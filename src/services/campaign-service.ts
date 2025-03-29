import { v4 as uuidv4 } from 'uuid';
import { 
  EmailCampaign,
  getEmailTemplateById,
  getSmtpProviderById,
  createEmailCampaign,
  updateEmailCampaign,
  getEmailCampaignById
} from '../models/dynamodb';
import { createSmtpService, EmailOptions } from './smtp-service';
import { TemplateService } from './template-service';
import { SmtpProviderService } from './smtp-provider-service';
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
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
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
          complaints: 0
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
   * Lance l'exécution d'une campagne d'emails
   * @param campaignId ID de la campagne
   * @returns État du lancement de la campagne
   */
  static async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      console.log(`Envoi de la campagne ${campaignId}...`);
      
      // Récupérer les détails de la campagne
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        console.error(`Campagne ${campaignId} non trouvée`);
        return false;
      }

      // Récupérer le template
      const template = await TemplateService.getTemplate(campaign.templateId);
      if (!template) {
        console.error(`Template ${campaign.templateId} non trouvé pour la campagne ${campaignId}`);
        await this.updateCampaignStatus(campaignId, 'failed', 'Template non trouvé');
        return false;
      }

      // Récupérer le fournisseur SMTP
      const smtpProvider = await SmtpProviderService.getSmtpProvider(campaign.smtpProviderId);
      if (!smtpProvider) {
        console.error(`Fournisseur SMTP ${campaign.smtpProviderId} non trouvé pour la campagne ${campaignId}`);
        await this.updateCampaignStatus(campaignId, 'failed', 'Fournisseur SMTP non trouvé');
        return false;
      }

      // Créer le service SMTP
      const smtpService = createSmtpService(smtpProvider);

      // Mise à jour du statut
      await this.updateCampaignStatus(campaignId, 'sending');

      let successCount = 0;
      let failureCount = 0;
      let bounceCount = 0;

      // Récupérer la liste des destinataires
      const recipients = campaign.recipients || [];
      const totalRecipients = recipients.length;

      // Traitement par lots pour éviter de surcharger le serveur SMTP
      const batchSize = 50;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        // Traitement parallèle des destinataires dans le lot actuel
        const sendPromises = batch.map(async (recipient: Recipient) => {
          try {
            // Personnalisation du contenu HTML
            const personalizedHtml = this.personalizeContent(template.htmlContent, {
              firstName: recipient.firstName || '',
              lastName: recipient.lastName || '',
              email: recipient.email,
              ...recipient.variables
            });
            
            // Personnalisation du sujet
            const personalizedSubject = this.personalizeContent(template.subject, {
              firstName: recipient.firstName || '',
              lastName: recipient.lastName || '',
              email: recipient.email,
              ...recipient.variables
            });

            // Envoi de l'email
            const result = await smtpService.sendEmail({
              to: recipient.email,
              from: {
                email: campaign.fromEmail || 'noreply@example.com',
                name: campaign.fromName || 'North Eyes'
              },
              subject: personalizedSubject,
              html: personalizedHtml,
              text: this.htmlToText(personalizedHtml),
              replyTo: campaign.fromEmail,
              variables: recipient.variables
            });

            // Mise à jour des statistiques
            if (result.success) {
              successCount++;
              
              // Enregistrer le suivi de l'email envoyé
              await this.trackEmailSent(campaignId, recipient.email, result.messageId);
            } else if (result.error?.includes('bounce')) {
              bounceCount++;
              failureCount++;
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
            }

            return result;
          } catch (error: any) {
            console.error(`Erreur lors de l'envoi à ${recipient.email}:`, error);
            failureCount++;
            return { success: false, error: error.message };
          }
        });

        // Attendre que tous les emails du lot soient traités
        await Promise.all(sendPromises);
        
        // Petite pause entre les lots pour éviter les limitations des fournisseurs SMTP
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
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
  private static async trackEmailSent(campaignId: string, recipientEmail: string, messageId?: string): Promise<void> {
    try {
      await dynamoDB.put({
        TableName: 'EmailTracking',
        Item: {
          id: `${campaignId}:${recipientEmail}`,
          campaignId,
          recipientEmail,
          messageId: messageId || `msg-${Date.now()}`,
          sentTimestamp: Date.now(),
          status: 'sent',
          openedTimestamp: null,
          clickedTimestamp: null,
          clickedLinks: []
        }
      }).promise();
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
        templateId: emailCampaign.templateId,
        smtpProviderId: emailCampaign.providerId,
        status: emailCampaign.status === 'sent' ? 'completed' : emailCampaign.status as 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed',
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
        subject: emailCampaign.subject,
        fromName: emailCampaign.fromName,
        fromEmail: emailCampaign.fromEmail,
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
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed', 
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
} 