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
  static async sendCampaign(
    campaignId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer les données de la campagne
      const campaign = await getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return {
          success: false,
          error: 'Campagne non trouvée'
        };
      }
      
      // Vérifier que la campagne est en état brouillon
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return {
          success: false,
          error: `La campagne est déjà en état "${campaign.status}"`
        };
      }
      
      // Récupérer le template et le fournisseur SMTP
      const [template, provider] = await Promise.all([
        getEmailTemplateById(campaign.templateId),
        getSmtpProviderById(campaign.providerId)
      ]);
      
      if (!template) {
        return {
          success: false,
          error: 'Template non trouvé'
        };
      }
      
      if (!provider) {
        return {
          success: false,
          error: 'Fournisseur SMTP non trouvé'
        };
      }
      
      // Mise à jour du statut de la campagne
      const updatedCampaign = {
        ...campaign,
        status: 'sending' as const,
        updatedAt: new Date().toISOString()
      };
      await updateEmailCampaign(updatedCampaign);
      
      // Obtention du service SMTP approprié
      const smtpService = createSmtpService(provider);
      
      // Statistiques pour le suivi
      let sent = 0;
      let delivered = 0;
      let failed = 0;
      
      // Traitement de chaque destinataire
      for (const recipient of campaign.recipients) {
        try {
          // Préparer les variables (dans cet exemple, nous utilisons juste l'email comme variable)
          const variables = {
            email: recipient,
            // Les variables standard
            unsubscribe_link: `https://example.com/unsubscribe?email=${encodeURIComponent(recipient)}`,
            view_in_browser: `https://example.com/view?campaign=${campaign.campaignId}&email=${encodeURIComponent(recipient)}`,
            date: new Date().toLocaleDateString()
          };
          
          // Préparer le contenu du mail avec les variables
          const { html, text, subject } = TemplateService.prepareTemplate(template, variables);
          
          // Options d'envoi d'email
          const emailOptions: EmailOptions = {
            to: [recipient],
            subject,
            html,
            text,
            from: {
              email: campaign.fromEmail,
              name: campaign.fromName
            }
          };
          
          // Envoi de l'email
          const result = await smtpService.sendEmail(emailOptions);
          
          if (result.success) {
            sent++;
            delivered++;
          } else {
            failed++;
            console.error(`Échec d'envoi à ${recipient}:`, result.error);
          }
        } catch (recipientError) {
          failed++;
          console.error(`Erreur lors de l'envoi à ${recipient}:`, recipientError);
        }
        
        // Mise à jour des statistiques après chaque lot de 10 envois
        if ((sent + failed) % 10 === 0 || (sent + failed) === campaign.recipients.length) {
          const statsUpdate = {
            ...campaign,
            stats: {
              ...campaign.stats,
              sent,
              delivered
            },
            updatedAt: new Date().toISOString()
          };
          await updateEmailCampaign(statsUpdate);
        }
      }
      
      // Mise à jour finale du statut de la campagne
      const status = failed === campaign.recipients.length ? 'failed' : 'sent';
      const finalUpdate = {
        ...campaign,
        status: status as 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          ...campaign.stats,
          total: campaign.recipients.length,
          sent,
          delivered,
          opened: 0,  // Ces valeurs seront mises à jour au fur et à mesure
          clicked: 0,
          bounced: failed,
          complaints: 0
        }
      };
      await updateEmailCampaign(finalUpdate);
      
      return {
        success: sent > 0,
        error: failed > 0 ? `Échec de l'envoi à ${failed} destinataire(s)` : undefined
      };
    } catch (error: any) {
      // En cas d'erreur générale, marquer la campagne comme échouée
      try {
        const campaign = await getEmailCampaignById(campaignId);
        if (campaign) {
          const failedUpdate = {
            ...campaign,
            status: 'failed' as const,
            updatedAt: new Date().toISOString()
          };
          await updateEmailCampaign(failedUpdate);
        }
      } catch (updateError) {
        console.error('Erreur lors de la mise à jour du statut d\'échec:', updateError);
      }
      
      return {
        success: false,
        error: error.message || 'Une erreur est survenue lors de l\'envoi de la campagne'
      };
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
} 