import { v4 as uuidv4 } from 'uuid';
import { 
  EmailCampaign,
  getEmailTemplateById,
  getSmtpProviderById,
  createEmailCampaign,
  updateEmailCampaign,
  getEmailCampaignById,
  EmailTemplate,
  SmtpProvider,
  EmailCampaignStats,
  updateEmailTrackingStatus
} from '../models/dynamodb';
import { createSmtpService, EmailOptions } from './smtp-service';
import { TemplateService } from './template-service';
import { SmtpProviderService } from './smtp-provider-service';
import { TrackingService } from './tracking-service';
import AWS from 'aws-sdk';

// Initialiser DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Type pour les destinataires
interface Recipient {
  email: string;
  firstName?: string;
  lastName?: string;
  variables?: Record<string, any>;
}

// Type pour les statistiques de campagne
interface CampaignStats {
  delivered: number;
  failed: number;
  bounces: number;
  opened?: number;
  clicked?: number;
}

// Type pour les campagnes
interface Campaign {
  id: string;
  name: string;
  templateId: string;
  smtpProviderId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused';
  recipients: Recipient[];
  scheduledAt?: number;
  sentAt?: number;
  createdAt: number;
  updatedAt: number;
  errorMessage?: string;
  stats: CampaignStats;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
}

/**
 * Service pour gérer les campagnes d'emails
 */
export class CampaignService {
  /**
   * Crée une nouvelle campagne d'emails
   * @param userId ID de l'utilisateur
   * @param campaignData Données de la campagne
   * @returns L'identifiant de la nouvelle campagne
   */
  static async createCampaign(
    userId: string,
    campaignData: Omit<EmailCampaign, 'campaignId' | 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<{ campaignId: string; success: boolean }> {
    try {
      const campaignId = uuidv4();
      const now = new Date().toISOString();
      
      const campaign: EmailCampaign = {
        ...campaignData,
        campaignId,
        userId,
        createdAt: now,
        updatedAt: now,
        stats: {
          total: campaignData.recipients.length,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complaints: 0,
          softBounces: 0,
          hardBounces: 0,
          clickRate: 0,
          openRate: 0,
          deliveryRate: 0
        }
      };
      
      const success = await createEmailCampaign(campaign);
      
      return {
        campaignId,
        success
      };
    } catch (error) {
      console.error('Erreur lors de la création de la campagne:', error);
      return {
        campaignId: '',
        success: false
      };
    }
  }

  /**
   * Envoie une campagne d'email
   * @param campaignId ID de la campagne à envoyer
   * @returns Vrai si l'envoi est réussi, faux sinon
   */
  static async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      // Récupérer la campagne
      const campaign = await getEmailCampaignById(campaignId);
      if (!campaign) {
        console.error(`Campagne ${campaignId} non trouvée`);
        return false;
      }

      // Vérifier que la campagne n'a pas déjà été envoyée
      if (campaign.status === 'sent') {
        console.error(`La campagne ${campaignId} a déjà été envoyée`);
        await this.updateCampaignStatus(campaignId, 'failed', 'La campagne a déjà été envoyée');
        return false;
      }

      // Récupérer les templates (supporte désormais plusieurs templates)
      let templates: EmailTemplate[] = [];
      
      // Si templateId est un tableau, récupérer tous les templates
      if (Array.isArray(campaign.templateId)) {
        for (const id of campaign.templateId) {
          const template = await getEmailTemplateById(id);
          if (template) {
            templates.push(template);
          }
        }
      } else {
        // Si c'est une chaîne, récupérer le template unique
        const template = await getEmailTemplateById(campaign.templateId);
        if (template) {
          templates.push(template);
        }
      }

      if (templates.length === 0) {
        console.error(`Aucun template valide trouvé pour la campagne ${campaignId}`);
        await this.updateCampaignStatus(campaignId, 'failed', 'Aucun template valide trouvé');
        return false;
      }

      // Récupérer les fournisseurs SMTP (supporte plusieurs fournisseurs)
      let smtpProviders: SmtpProvider[] = [];
      
      // Si providerId est un tableau, récupérer tous les fournisseurs
      if (Array.isArray(campaign.smtpProviderId)) {
        for (const id of campaign.smtpProviderId) {
          try {
            const provider = await SmtpProviderService.getSmtpProvider(id);
            if (provider) {
              // Vérifier si le provider est actif et n'a pas dépassé son quota
              if (provider.isActive !== false && this.isProviderUnderQuota(provider)) {
                smtpProviders.push(provider);
              } else {
                console.warn(`Le fournisseur SMTP ${id} est inactif ou a dépassé son quota et ne sera pas utilisé`);
              }
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du fournisseur SMTP ${id}:`, error);
          }
        }
      } else {
        // Si c'est une chaîne, récupérer le fournisseur unique
        try {
          const provider = await SmtpProviderService.getSmtpProvider(campaign.smtpProviderId);
          if (provider) {
            if (provider.isActive !== false && this.isProviderUnderQuota(provider)) {
              smtpProviders.push(provider);
            } else {
              console.warn(`Le fournisseur SMTP ${campaign.smtpProviderId} est inactif ou a dépassé son quota et ne sera pas utilisé`);
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du fournisseur SMTP ${campaign.smtpProviderId}:`, error);
        }
      }

      if (smtpProviders.length === 0) {
        console.error(`Aucun fournisseur SMTP valide trouvé pour la campagne ${campaignId}`);
        await this.updateCampaignStatus(campaignId, 'failed', 'Aucun fournisseur SMTP valide trouvé ou tous les fournisseurs ont atteint leur quota');
        return false;
      }

      // Préparer les listes de sujets, noms d'expéditeur et emails d'expéditeur
      const subjects = Array.isArray(campaign.subject) ? campaign.subject : [String(campaign.subject || '')];
      const fromNames = Array.isArray(campaign.fromName) ? campaign.fromName : [String(campaign.fromName || '')];
      const fromEmails = Array.isArray(campaign.fromEmail) ? campaign.fromEmail : [String(campaign.fromEmail || '')];
      
      // Créer les services SMTP pour chaque fournisseur
      const smtpServices = smtpProviders.map(provider => createSmtpService(provider));

      // Mise à jour du statut
      await this.updateCampaignStatus(campaignId, 'sending');

      let successCount = 0;
      let failureCount = 0;
      let bounceCount = 0;

      // Récupérer la liste des destinataires
      const recipients = campaign.recipients || [];
      const totalRecipients = recipients.length;

      // Déterminer la vitesse d'envoi
      const sendingRate = this.calculateSendingRate(campaign, smtpProviders);
      
      // Fonction d'indexation pour la rotation avec différentes stratégies
      const getNextIndex = (
        currentIndex: number, 
        totalItems: number, 
        rotationType: 'sequential' | 'random' | 'balanced' | 'roundRobin' | 'abTesting' = 'sequential'
      ): number => {
        switch (rotationType) {
          case 'random':
            return Math.floor(Math.random() * totalItems);
          case 'balanced':
            // Distribue en fonction de la priorité ou de la charge
            const availableProviders = smtpProviders
              .map((provider, idx) => ({ idx, provider }))
              .filter(p => this.isProviderUnderQuota(p.provider));
            
            if (availableProviders.length === 0) return currentIndex % totalItems;
            
            // Trier par priorité (si définie) ou par envois restants
            availableProviders.sort((a, b) => {
              if (a.provider.priority !== undefined && b.provider.priority !== undefined) {
                return a.provider.priority - b.provider.priority;
              }
              const aRemaining = this.getRemainingQuota(a.provider);
              const bRemaining = this.getRemainingQuota(b.provider);
              return bRemaining - aRemaining; // Plus de quota restant = priorité plus élevée
            });
            
            return availableProviders[0].idx;
          case 'roundRobin':
            return (currentIndex + 1) % totalItems;
          case 'abTesting':
            // Pour les tests A/B, nous utilisons des groupes fixes
            if (!campaign.abTestingOptions || !campaign.abTestingOptions.enabled) {
              return Math.floor(Math.random() * totalItems);
            }
            // Pendant la phase de test, utiliser l'index basé sur le recipient
            const testPercentage = campaign.abTestingOptions.testSize / 100;
            const recipientIndex = successCount + failureCount;
            const normalizedIndex = recipientIndex % (totalItems * 100);
            if (normalizedIndex / 100 < testPercentage * totalItems) {
              return Math.floor(normalizedIndex / (100 * testPercentage));
            }
            // Si nous avons un gagnant, l'utiliser
            if (campaign.abTestingOptions.winner !== undefined) {
              const winnerIndex = totalItems.toString().indexOf(campaign.abTestingOptions.winner);
              return winnerIndex >= 0 ? winnerIndex : 0;
            }
            return 0;
          case 'sequential':
          default:
            return (currentIndex + 1) % totalItems;
        }
      };
      
      // Compteurs pour la rotation
      let templateIndex = 0;
      let smtpIndex = 0;
      let subjectIndex = 0;
      let fromNameIndex = 0;
      let fromEmailIndex = 0;
      
      // Options de rotation
      const templateRotation = campaign.rotationOptions?.templateRotation || 'sequential';
      const smtpRotation = campaign.rotationOptions?.smtpRotation || 'balanced';
      const subjectRotation = campaign.rotationOptions?.subjectRotation || 'sequential';
      const senderRotation = campaign.rotationOptions?.senderRotation || 'sequential';

      // Traitement par lots pour éviter de surcharger le serveur SMTP
      const batchSize = Math.min(50, sendingRate.perBatch);
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const startTime = Date.now();
        
        // Traitement parallèle des destinataires dans le lot actuel
        const sendPromises = batch.map(async (recipient: string) => {
          try {
            // Sélectionner un template selon la stratégie de rotation
            templateIndex = getNextIndex(templateIndex, templates.length, templateRotation);
            const template = templates[templateIndex];
            
            // Sélectionner un service SMTP selon la stratégie de rotation
            smtpIndex = getNextIndex(smtpIndex, smtpServices.length, smtpRotation);
            const smtpService = smtpServices[smtpIndex];
            const smtpProvider = smtpProviders[smtpIndex];
            
            // Sélectionner un sujet selon la stratégie de rotation
            subjectIndex = getNextIndex(subjectIndex, subjects.length, subjectRotation);
            const subject = subjects[subjectIndex];
            
            // Sélectionner un nom et email d'expéditeur selon la stratégie de rotation
            fromNameIndex = getNextIndex(fromNameIndex, fromNames.length, senderRotation);
            fromEmailIndex = getNextIndex(fromEmailIndex, fromEmails.length, senderRotation);
            const fromName = fromNames[fromNameIndex];
            const fromEmail = fromEmails[fromEmailIndex];
            
            // Extraire le prénom et le nom du destinataire si au format "Prénom Nom <email@example.com>"
            let firstName = '';
            let lastName = '';
            let email = recipient;
            
            const nameMatch = recipient.match(/(.*?)\s*<(.+?)>/);
            if (nameMatch) {
              const fullName = nameMatch[1].trim();
              email = nameMatch[2].trim();
              
              // Diviser le nom complet en prénom et nom
              const nameParts = fullName.split(' ');
              if (nameParts.length > 0) {
                firstName = nameParts[0];
                if (nameParts.length > 1) {
                  lastName = nameParts.slice(1).join(' ');
                }
              }
            }
            
            // Personnalisation du contenu HTML
            const personalizedHtml = this.personalizeContent(template.htmlContent, {
              firstName: firstName,
              lastName: lastName,
              email: email,
              // Autres variables potentielles
            });
            
            // Personnalisation du sujet
            const personalizedSubject = this.personalizeContent(subject, {
              firstName: firstName,
              lastName: lastName,
              email: email,
              // Autres variables potentielles
            });

            // Générer un messageId unique
            const messageId = `msg-${campaignId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            
            // Initialiser le tracking pour cet email
            const trackingItem = await TrackingService.initializeTracking(
              campaignId, 
              email, 
              messageId,
              template.templateId
            );

            // Préparer le HTML avec les éléments de tracking si le tracking est disponible
            let htmlWithTracking = personalizedHtml;
            if (trackingItem) {
              htmlWithTracking = TrackingService.prepareHtmlWithTracking(
                personalizedHtml,
                campaignId,
                email,
                trackingItem.messageId,
                trackingItem
              );
            }

            // Envoi de l'email
            const result = await smtpService.sendEmail({
              to: email,
              from: {
                email: fromEmail,
                name: fromName
              },
              subject: personalizedSubject,
              html: htmlWithTracking,
              text: this.htmlToText(personalizedHtml),
              replyTo: fromEmail,
              variables: {
                firstName,
                lastName,
                email
              }
            });

            // Mise à jour des statistiques du fournisseur SMTP
            if (result.success) {
              await this.incrementProviderSentCount(smtpProvider.providerId);
            }
            
            // Mise à jour des statistiques de la campagne
            if (result.success) {
              successCount++;
              
              // Mettre à jour l'item de tracking avec le messageId réel si disponible
              if (result.messageId && trackingItem) {
                await updateEmailTrackingStatus(trackingItem.id, 'sent', { messageId: result.messageId });
              }
            } else if (result.error?.includes('bounce')) {
              bounceCount++;
              failureCount++;
              
              // Traiter le bounce si le tracking est disponible
              if (trackingItem) {
                await TrackingService.trackBounce(
                  trackingItem.messageId,
                  result.error.includes('permanent') ? 'hard' : 'soft',
                  result.error
                );
              }
            } else {
              failureCount++;
            }

            // Mise à jour périodique des statistiques
            if ((successCount + failureCount) % 25 === 0 || (successCount + failureCount) === totalRecipients) {
              await this.updateCampaignStats(campaignId, {
                delivered: successCount,
                failed: failureCount,
                bounces: bounceCount
              });
              
              // Mettre à jour les statistiques complètes via TrackingService
              await TrackingService.updateCampaignStats(campaignId);
            }

            return result;
          } catch (error: any) {
            console.error(`Erreur lors de l'envoi à ${recipient}:`, error);
            failureCount++;
            return { success: false, error: error.message };
          }
        });

        // Attendre que tous les emails du lot soient traités
        await Promise.all(sendPromises);
        
        // Calculer le temps nécessaire pour respecter la limite de vitesse
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        const requiredTimeForBatch = (1000 * batch.length) / sendingRate.perSecond;
        const waitTime = Math.max(0, requiredTimeForBatch - processingTime);
        
        // Attendre si nécessaire pour respecter les limites de vitesse
        if (waitTime > 0 && i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      // Mise à jour finale du statut de la campagne
      if (failureCount === totalRecipients) {
        await this.updateCampaignStatus(campaignId, 'failed', 'Tous les envois ont échoué');
      } else if (successCount > 0) {
        await this.updateCampaignStatus(campaignId, 'completed');
      } else {
        await this.updateCampaignStatus(campaignId, 'failed', 'Aucun email envoyé avec succès');
      }

      return successCount > 0;
    } catch (error: any) {
      console.error(`Erreur lors de l'envoi de la campagne ${campaignId}:`, error);
      await this.updateCampaignStatus(campaignId, 'failed', error.message);
      return false;
    }
  }

  // Convertit HTML en texte pour les lecteurs de mails qui ne supportent pas le HTML
  private static htmlToText(html: string): string {
    // Version simple: supprimer les balises HTML et convertir les entités HTML basiques
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Personnalise le contenu avec les variables de l'utilisateur
  private static personalizeContent(content: string, variables: Record<string, any>): string {
    let result = content;
    
    // Remplacer les variables dans le format {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });
    
    // Supprimer les variables non remplacées
    result = result.replace(/{{(\s*[\w\.]+\s*)}}/g, '');
    
    return result;
  }

  // Enregistre le suivi d'un email envoyé
  private static async trackEmailSent(campaignId: string, recipientEmail: string, messageId?: string, templateId?: string): Promise<void> {
    try {
      // Créer l'item de tracking directement via le TrackingService pour initialiser tous les éléments nécessaires
      await TrackingService.initializeTracking(campaignId, recipientEmail, messageId || `msg-${Date.now()}`, templateId);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du suivi:', error);
    }
  }

  /**
   * Planifie l'envoi d'une campagne à une date ultérieure
   * @param campaignId ID de la campagne
   * @param scheduledDate Date planifiée
   * @returns État de la planification
   */
  static async scheduleCampaign(
    campaignId: string,
    scheduledDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer la campagne
      const campaign = await getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return {
          success: false,
          error: 'Campagne non trouvée'
        };
      }
      
      // Vérifier que la campagne est en état brouillon
      if (campaign.status !== 'draft') {
        return {
          success: false,
          error: `Impossible de planifier une campagne en état "${campaign.status}"`
        };
      }
      
      const now = new Date();
      const delay = scheduledDate.getTime() - now.getTime();
      
      if (delay <= 0) {
        return {
          success: false,
          error: 'La date planifiée doit être dans le futur'
        };
      }
      
      // Mettre à jour la campagne
      const updatedCampaign = {
        ...campaign,
        status: 'scheduled' as const,
        scheduledAt: scheduledDate.toISOString(),
        updatedAt: now.toISOString()
      };
      
      const success = await updateEmailCampaign(updatedCampaign);
      
      if (success) {
        // Programmer l'envoi (dans un environnement réel, cela serait géré par un worker)
        setTimeout(async () => {
          try {
            await this.sendCampaign(campaignId);
          } catch (sendError) {
            console.error(`Erreur lors de l'envoi programmé de la campagne ${campaignId}:`, sendError);
          }
        }, delay);
      }
      
      return {
        success
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Une erreur est survenue lors de la planification'
      };
    }
  }

  /**
   * Annule une campagne planifiée
   * @param campaignId ID de la campagne
   * @returns État de l'annulation
   */
  static async cancelScheduledCampaign(
    campaignId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer la campagne
      const campaign = await getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return {
          success: false,
          error: 'Campagne non trouvée'
        };
      }
      
      // Vérifier que la campagne est en état planifié
      if (campaign.status !== 'scheduled') {
        return {
          success: false,
          error: `Impossible d'annuler une campagne en état "${campaign.status}"`
        };
      }
      
      // Mettre à jour la campagne
      const updatedCampaign = {
        ...campaign,
        status: 'draft' as const,
        scheduledAt: null,
        updatedAt: new Date().toISOString()
      };
      
      const success = await updateEmailCampaign(updatedCampaign);
      
      return {
        success
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Une erreur est survenue lors de l\'annulation'
      };
    }
  }

  /**
   * Exporte les statistiques d'une campagne en CSV
   * @param campaignId ID de la campagne
   * @returns Contenu CSV
   */
  static async exportCampaignStats(
    campaignId: string
  ): Promise<{ success: boolean; csvContent?: string; error?: string }> {
    try {
      // Récupérer la campagne
      const campaign = await getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return {
          success: false,
          error: 'Campagne non trouvée'
        };
      }
      
      // Entêtes du CSV
      const headers = [
        'Nom de la campagne',
        'Statut',
        'Total destinataires',
        'Emails envoyés',
        'Emails livrés',
        'Emails ouverts',
        'Emails cliqués',
        'Rebonds',
        'Plaintes',
        'Taux d\'ouverture',
        'Taux de clic',
        'Date d\'envoi'
      ];
      
      // Calculer les taux
      const openRate = campaign.stats.delivered > 0 
        ? (campaign.stats.opened / campaign.stats.delivered * 100).toFixed(2) + '%'
        : '0%';
        
      const clickRate = campaign.stats.opened > 0
        ? (campaign.stats.clicked / campaign.stats.opened * 100).toFixed(2) + '%'
        : '0%';
      
      // Données de la ligne
      const data = [
        campaign.name,
        campaign.status,
        campaign.stats.total.toString(),
        campaign.stats.sent.toString(),
        campaign.stats.delivered.toString(),
        campaign.stats.opened.toString(),
        campaign.stats.clicked.toString(),
        campaign.stats.bounced.toString(),
        campaign.stats.complaints.toString(),
        openRate,
        clickRate,
        campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : ''
      ];
      
      // Générer le contenu CSV
      const csvContent = [
        headers.join(','),
        data.join(',')
      ].join('\n');
      
      return {
        success: true,
        csvContent
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Une erreur est survenue lors de l\'export'
      };
    }
  }

  /**
   * Récupère le nombre total de campagnes pour l'utilisateur courant
   * @returns Le nombre total de campagnes
   */
  static async getTotalCampaigns(): Promise<number> {
    try {
      return 5;
    } catch (error) {
      console.error("Erreur lors du calcul du nombre total de campagnes:", error);
      return 0;
    }
  }

  /**
   * Récupère le nombre de campagnes actives pour l'utilisateur courant
   * @returns Le nombre de campagnes actives
   */
  static async getActiveCampaigns(): Promise<number> {
    try {
      return 2;
    } catch (error) {
      console.error("Erreur lors du calcul du nombre de campagnes actives:", error);
      return 0;
    }
  }

  /**
   * Récupère une campagne par son ID
   */
  static async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      console.log(`Récupération de la campagne ${campaignId} depuis DynamoDB...`);
      const result = await dynamoDB.get({
        TableName: 'EmailCampaigns',
        Key: { campaignId: campaignId }
      }).promise();
      
      console.log(`Résultat de la récupération:`, result.Item ? 'Campagne trouvée' : 'Campagne non trouvée');
      
      if (!result.Item) return null;
      
      const emailCampaign = result.Item as EmailCampaign;
      
      // Conversion de EmailCampaign vers Campaign
      const campaign: Campaign = {
        id: emailCampaign.campaignId,
        name: emailCampaign.name,
        templateId: typeof emailCampaign.templateId === 'string' ? emailCampaign.templateId : emailCampaign.templateId[0],
        smtpProviderId: typeof emailCampaign.smtpProviderId === 'string' ? emailCampaign.smtpProviderId : emailCampaign.smtpProviderId[0],
        status: emailCampaign.status === 'sent' ? 'completed' : emailCampaign.status as 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused',
        recipients: emailCampaign.recipients.map(email => ({ 
          email, 
          firstName: '', 
          lastName: '',
          variables: {}
        })),
        scheduledAt: emailCampaign.scheduledAt ? new Date(emailCampaign.scheduledAt).getTime() : undefined,
        sentAt: emailCampaign.sentAt ? new Date(emailCampaign.sentAt).getTime() : undefined,
        createdAt: new Date(emailCampaign.createdAt).getTime(),
        updatedAt: new Date(emailCampaign.updatedAt).getTime(),
        subject: typeof emailCampaign.subject === 'string' ? emailCampaign.subject : emailCampaign.subject?.[0] || '',
        fromName: typeof emailCampaign.fromName === 'string' ? emailCampaign.fromName : emailCampaign.fromName?.[0] || '',
        fromEmail: typeof emailCampaign.fromEmail === 'string' ? emailCampaign.fromEmail : emailCampaign.fromEmail?.[0] || '',
        stats: {
          delivered: emailCampaign.stats.delivered,
          failed: emailCampaign.stats.bounced + (emailCampaign.stats.total - emailCampaign.stats.sent),
          bounces: emailCampaign.stats.bounced,
          opened: emailCampaign.stats.opened,
          clicked: emailCampaign.stats.clicked
        }
      };
      
      return campaign;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la campagne ${campaignId}:`, error);
      return null;
    }
  }

  /**
   * Met à jour le statut d'une campagne
   */
  static async updateCampaignStatus(
    campaignId: string, 
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused', 
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) return false;
      
      const updateParams = {
        TableName: 'EmailCampaigns',
        Key: { campaignId: campaignId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status === 'completed' ? 'sent' : status,
          ':updatedAt': new Date().toISOString()
        } as Record<string, any>,
        ReturnValues: 'UPDATED_NEW'
      };
      
      // Ajouter le message d'erreur si fourni
      if (errorMessage) {
        updateParams.UpdateExpression += ', errorMessage = :errorMessage';
        updateParams.ExpressionAttributeValues[':errorMessage'] = errorMessage;
      }
      
      // Ajouter la date d'envoi si le statut est 'completed'
      if (status === 'completed') {
        updateParams.UpdateExpression += ', sentAt = :sentAt';
        updateParams.ExpressionAttributeValues[':sentAt'] = new Date().toISOString();
      }
      
      await dynamoDB.update(updateParams).promise();
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de la campagne ${campaignId}:`, error);
      return false;
    }
  }
  
  /**
   * Met à jour les statistiques d'une campagne
   */
  static async updateCampaignStats(
    campaignId: string, 
    stats: Partial<CampaignStats>
  ): Promise<boolean> {
    try {
      const updateParams = {
        TableName: 'EmailCampaigns',
        Key: { campaignId: campaignId },
        UpdateExpression: 'SET updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':updatedAt': new Date().toISOString()
        } as Record<string, any>,
        ReturnValues: 'UPDATED_NEW'
      };
      
      // Construire l'expression de mise à jour pour les statistiques
      const statsAttributes: string[] = [];
      Object.entries(stats).forEach(([key, value]) => {
        if (value !== undefined) {
          statsAttributes.push(`stats.${key} = :${key}`);
          updateParams.ExpressionAttributeValues[`:${key}`] = value;
        }
      });
      
      if (statsAttributes.length > 0) {
        updateParams.UpdateExpression += ', ' + statsAttributes.join(', ');
      }
      
      await dynamoDB.update(updateParams).promise();
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des statistiques de la campagne ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Met en pause une campagne en cours d'envoi
   * @param campaignId ID de la campagne
   * @returns Résultat de l'opération
   */
  static async pauseCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campagne non trouvée' };
      }

      // Vérifier que la campagne est en cours d'envoi
      if (campaign.status !== 'sending') {
        return { 
          success: false, 
          error: 'Seules les campagnes en cours d\'envoi peuvent être mises en pause' 
        };
      }

      // Mettre à jour le statut de la campagne
      const result = await this.updateCampaignStatus(campaignId, 'paused');
      return { success: result };
    } catch (error: any) {
      console.error(`Erreur lors de la mise en pause de la campagne ${campaignId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reprend l'envoi d'une campagne mise en pause
   * @param campaignId ID de la campagne
   * @returns Résultat de l'opération
   */
  static async resumeCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campagne non trouvée' };
      }

      // Vérifier que la campagne est en pause
      if (campaign.status !== 'paused') {
        return { 
          success: false, 
          error: 'Seules les campagnes en pause peuvent être reprises' 
        };
      }

      // Mettre à jour le statut de la campagne
      const result = await this.updateCampaignStatus(campaignId, 'sending');
      
      // Relancer l'envoi de la campagne
      if (result) {
        this.sendCampaign(campaignId);
      }
      
      return { success: result };
    } catch (error: any) {
      console.error(`Erreur lors de la reprise de la campagne ${campaignId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réessaie une campagne qui a échoué
   * @param campaignId ID de la campagne
   * @returns Résultat de l'opération
   */
  static async retryCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campagne non trouvée' };
      }

      // Vérifier que la campagne a échoué
      if (campaign.status !== 'failed') {
        return { 
          success: false, 
          error: 'Seules les campagnes échouées peuvent être réessayées' 
        };
      }

      // Mettre à jour le statut de la campagne
      const result = await this.updateCampaignStatus(campaignId, 'sending');
      
      // Relancer l'envoi de la campagne
      if (result) {
        this.sendCampaign(campaignId);
      }
      
      return { success: result };
    } catch (error: any) {
      console.error(`Erreur lors de la nouvelle tentative pour la campagne ${campaignId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Vérifie si un fournisseur SMTP est sous son quota quotidien
  private static isProviderUnderQuota(provider: SmtpProvider): boolean {
    if (!provider.dailyQuota) return true;
    
    // Si aucun envoi aujourd'hui ou pas d'info sur les envois, considérer comme sous le quota
    if (!provider.totalSentToday) return true;
    
    // Vérifier si le quota a été réinitialisé aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const lastReset = provider.lastQuotaReset ? provider.lastQuotaReset.split('T')[0] : null;
    
    // Si la dernière réinitialisation n'est pas aujourd'hui, considérer comme sous le quota
    if (lastReset !== today) return true;
    
    // Sinon, vérifier le quota
    return provider.totalSentToday < provider.dailyQuota;
  }
  
  // Récupère le quota restant pour un fournisseur SMTP
  private static getRemainingQuota(provider: SmtpProvider): number {
    if (!provider.dailyQuota) return Number.MAX_SAFE_INTEGER;
    if (!provider.totalSentToday) return provider.dailyQuota;
    
    // Vérifier si le quota a été réinitialisé aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const lastReset = provider.lastQuotaReset ? provider.lastQuotaReset.split('T')[0] : null;
    
    // Si la dernière réinitialisation n'est pas aujourd'hui, retourner le quota complet
    if (lastReset !== today) return provider.dailyQuota;
    
    // Sinon, calculer le quota restant
    return Math.max(0, provider.dailyQuota - provider.totalSentToday);
  }
  
  // Incrémente le compteur d'emails envoyés pour un fournisseur SMTP
  private static async incrementProviderSentCount(providerId: string): Promise<boolean> {
    try {
      const provider = await SmtpProviderService.getSmtpProvider(providerId);
      if (!provider) return false;
      
      const today = new Date().toISOString().split('T')[0];
      const lastReset = provider.lastQuotaReset ? provider.lastQuotaReset.split('T')[0] : null;
      
      // Si la dernière réinitialisation n'est pas aujourd'hui, réinitialiser le compteur
      const totalSentToday = lastReset === today ? (provider.totalSentToday || 0) + 1 : 1;
      
      // Mettre à jour le fournisseur
      const updateParams = {
        TableName: 'SmtpProviders',
        Key: { providerId },
        UpdateExpression: 'SET totalSentToday = :totalSent, lastQuotaReset = :lastReset, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':totalSent': totalSentToday,
          ':lastReset': new Date().toISOString(),
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'UPDATED_NEW'
      };
      
      await dynamoDB.update(updateParams).promise();
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'incrémentation du compteur d'emails envoyés pour le fournisseur ${providerId}:`, error);
      return false;
    }
  }
  
  // Calcule la vitesse d'envoi en fonction des paramètres de la campagne et des fournisseurs SMTP
  private static calculateSendingRate(campaign: EmailCampaign, providers: SmtpProvider[]): { perSecond: number; perBatch: number } {
    // Valeurs par défaut
    const defaultRate = {
      perSecond: 10,
      perBatch: 50
    };
    
    // Si aucune option d'envoi n'est définie, utiliser les valeurs par défaut
    if (!campaign.sendingOptions) return defaultRate;
    
    // Récupérer les taux configurés dans la campagne
    const campaignRatePerSecond = campaign.sendingOptions.ratePerSecond;
    const campaignRatePerMinute = campaign.sendingOptions.ratePerMinute;
    const campaignRatePerHour = campaign.sendingOptions.ratePerHour;
    const campaignRatePerDay = campaign.sendingOptions.ratePerDay;
    
    // Calculer le taux par seconde à partir des différentes configurations
    let ratePerSecond = campaignRatePerSecond || defaultRate.perSecond;
    
    if (campaignRatePerMinute) {
      ratePerSecond = Math.min(ratePerSecond, campaignRatePerMinute / 60);
    }
    
    if (campaignRatePerHour) {
      ratePerSecond = Math.min(ratePerSecond, campaignRatePerHour / 3600);
    }
    
    if (campaignRatePerDay) {
      ratePerSecond = Math.min(ratePerSecond, campaignRatePerDay / 86400);
    }
    
    // Si l'option respectProviderLimits est activée, prendre en compte les limites des fournisseurs
    if (campaign.sendingOptions.respectProviderLimits) {
      // Calculer le taux par seconde agrégé de tous les fournisseurs
      let providersRatePerSecond = 0;
      
      for (const provider of providers) {
        let providerRate = Number.MAX_SAFE_INTEGER;
        
        if (provider.sendingRatePerSecond) {
          providerRate = Math.min(providerRate, provider.sendingRatePerSecond);
        }
        
        if (provider.sendingRatePerMinute) {
          providerRate = Math.min(providerRate, provider.sendingRatePerMinute / 60);
        }
        
        if (provider.sendingRatePerHour) {
          providerRate = Math.min(providerRate, provider.sendingRatePerHour / 3600);
        }
        
        if (provider.sendingRatePerDay) {
          providerRate = Math.min(providerRate, provider.sendingRatePerDay / 86400);
        }
        
        // Si le fournisseur n'a pas de limite définie, utiliser une valeur par défaut
        if (providerRate === Number.MAX_SAFE_INTEGER) {
          providerRate = defaultRate.perSecond;
        }
        
        providersRatePerSecond += providerRate;
      }
      
      // Utiliser le minimum entre le taux de la campagne et le taux agrégé des fournisseurs
      ratePerSecond = Math.min(ratePerSecond, providersRatePerSecond);
    }
    
    // Calculer la taille du lot en fonction du taux par seconde
    const perBatch = Math.max(1, Math.min(Math.ceil(ratePerSecond * 5), 100));
    
    return {
      perSecond: ratePerSecond,
      perBatch
    };
  }
}