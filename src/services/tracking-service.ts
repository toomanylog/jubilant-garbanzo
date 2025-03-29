import { v4 as uuidv4 } from 'uuid';
import { 
  EmailTrackingItem, 
  EmailCampaign, 
  EmailEvent,
  createEmailTrackingItem,
  createEmailEvent,
  updateEmailTrackingStatus,
  addClickToEmailTracking,
  getCampaignTracking,
  updateEmailCampaign,
  getEmailTrackingByMessageId
} from '../models/dynamodb';

// Utiliser le domaine de l'application déployée
const SITE_URL = process.env.REACT_APP_SITE_URL || window.location.origin;

/**
 * Service pour gérer le tracking des emails
 */
export class TrackingService {
  /**
   * Génère un pixel de tracking pour un email spécifique
   * @param campaignId ID de la campagne
   * @param recipientEmail Email du destinataire
   * @param pixelId ID du pixel (optionnel, généré automatiquement si non fourni)
   * @returns HTML du pixel de tracking
   */
  static generateTrackingPixel(campaignId: string, recipientEmail: string, pixelId?: string): string {
    const trackingId = pixelId || uuidv4();
    // Utiliser notre nouvelle URL de tracking
    const pixelUrl = `${SITE_URL}/track/p/${trackingId}?p=${encodeURIComponent(trackingId)}&c=${encodeURIComponent(campaignId)}&e=${encodeURIComponent(recipientEmail)}`;
    
    return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
  }

  /**
   * Insère le pixel de tracking dans le HTML de l'email
   * @param htmlContent Contenu HTML de l'email
   * @param pixelHtml HTML du pixel de tracking
   * @returns Contenu HTML avec le pixel de tracking
   */
  static insertTrackingPixel(htmlContent: string, pixelHtml: string): string {
    // Si le HTML contient une balise body fermante, insérer avant
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${pixelHtml}</body>`);
    }
    
    // Sinon, ajouter à la fin
    return htmlContent + pixelHtml;
  }

  /**
   * Transforme les liens dans le HTML pour ajouter le tracking des clics
   * @param htmlContent Contenu HTML de l'email
   * @param campaignId ID de la campagne
   * @param recipientEmail Email du destinataire
   * @param messageId ID du message
   * @returns HTML avec les liens de tracking
   */
  static trackLinks(htmlContent: string, campaignId: string, recipientEmail: string, messageId: string): string {
    // Regex pour trouver les liens
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>(.*?)<\/a>/gi;
    
    // Remplacer les liens
    return htmlContent.replace(linkRegex, (match, url, attrs, text) => {
      // Ignorer les liens d'ancre, mailto et tel
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return match;
      }
      
      // Générer un ID unique pour ce lien
      const linkId = uuidv4();
      
      // Créer l'URL de redirection avec notre nouvelle route
      const redirectUrl = `${SITE_URL}/track/r/${linkId}?l=${encodeURIComponent(linkId)}&c=${encodeURIComponent(campaignId)}&e=${encodeURIComponent(recipientEmail)}&m=${encodeURIComponent(messageId)}&u=${encodeURIComponent(url)}`;
      
      // Remplacer le lien
      return `<a href="${redirectUrl}"${attrs}>${text}</a>`;
    });
  }

  /**
   * Initialise le tracking pour un email
   * @param campaignId ID de la campagne
   * @param recipientEmail Email du destinataire
   * @param messageId ID du message
   * @param templateId ID du template
   * @returns Item de tracking créé
   */
  static async initializeTracking(campaignId: string, recipientEmail: string, messageId: string, templateId?: string): Promise<EmailTrackingItem | null> {
    try {
      console.log(`⚠️ Initialisation du tracking pour ${recipientEmail} dans la campagne ${campaignId}`);
      const pixelId = uuidv4();
      
      const trackingItem: EmailTrackingItem = {
        id: `${campaignId}:${recipientEmail}`,
        campaignId,
        recipientEmail,
        messageId,
        sentTimestamp: Date.now(),
        status: 'sent',
        openedTimestamp: null,
        clickedTimestamp: null,
        clickedLinks: [],
        templateId,
        pixelId
      };
      
      const success = await createEmailTrackingItem(trackingItem);
      
      if (success) {
        console.log(`✅ Tracking initialisé avec succès pour ${recipientEmail}`);
        return trackingItem;
      }
      
      console.error(`❌ Échec de l'initialisation du tracking pour ${recipientEmail}`);
      return null;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du tracking:', error);
      return null;
    }
  }

  /**
   * Prépare le contenu HTML avec tous les éléments de tracking
   * @param htmlContent Contenu HTML de l'email
   * @param campaignId ID de la campagne
   * @param recipientEmail Email du destinataire
   * @param messageId ID du message
   * @param trackingItem Item de tracking
   * @returns HTML avec les éléments de tracking
   */
  static prepareHtmlWithTracking(htmlContent: string, campaignId: string, recipientEmail: string, messageId: string, trackingItem: EmailTrackingItem): string {
    console.log(`⚠️ Préparation du tracking HTML pour ${recipientEmail}`);
    
    // Générer le pixel de tracking
    const pixelHtml = this.generateTrackingPixel(campaignId, recipientEmail, trackingItem.pixelId);
    
    // D'abord tracker les liens
    let trackedHtml = this.trackLinks(htmlContent, campaignId, recipientEmail, messageId);
    
    // Ensuite insérer le pixel
    trackedHtml = this.insertTrackingPixel(trackedHtml, pixelHtml);
    
    return trackedHtml;
  }

  /**
   * Traite un événement d'ouverture (pixel vu)
   * @param pixelId ID du pixel
   * @param campaignId ID de la campagne
   * @param recipientEmail Email du destinataire
   * @returns Succès de l'opération
   */
  static async trackOpen(pixelId: string, campaignId: string, recipientEmail: string): Promise<boolean> {
    try {
      const trackingId = `${campaignId}:${recipientEmail}`;
      
      // Mettre à jour le statut de tracking
      const updated = await updateEmailTrackingStatus(trackingId, 'opened');
      
      // Créer un événement
      const event: EmailEvent = {
        id: uuidv4(),
        timestamp: Date.now(),
        eventType: 'open',
        messageId: '', // Sera rempli lors du traitement
        campaignId,
        recipientEmail
      };
      
      await createEmailEvent(event);
      
      // Mettre à jour les statistiques de la campagne
      await this.updateCampaignStats(campaignId);
      
      return updated;
    } catch (error) {
      console.error('Erreur lors du tracking d\'ouverture:', error);
      return false;
    }
  }

  /**
   * Traite un événement de clic sur un lien
   * @param linkId ID du lien
   * @param campaignId ID de la campagne
   * @param recipientEmail Email du destinataire
   * @param messageId ID du message
   * @param url URL originale
   * @returns URL originale pour redirection
   */
  static async trackClick(linkId: string, campaignId: string, recipientEmail: string, messageId: string, url: string): Promise<string> {
    try {
      const trackingId = `${campaignId}:${recipientEmail}`;
      
      // Ajouter le clic au tracking
      await addClickToEmailTracking(trackingId, url);
      
      // Créer un événement
      const event: EmailEvent = {
        id: uuidv4(),
        timestamp: Date.now(),
        eventType: 'click',
        messageId,
        campaignId,
        recipientEmail,
        metadata: { url, linkId }
      };
      
      await createEmailEvent(event);
      
      // Mettre à jour les statistiques de la campagne
      await this.updateCampaignStats(campaignId);
      
      return url;
    } catch (error) {
      console.error('Erreur lors du tracking de clic:', error);
      return url; // Retourner l'URL originale même en cas d'erreur
    }
  }

  /**
   * Traite une notification de bounce
   * @param messageId ID du message
   * @param bounceType Type de bounce ('hard' ou 'soft')
   * @param bounceReason Raison du bounce
   * @returns Succès de l'opération
   */
  static async trackBounce(messageId: string, bounceType: 'hard' | 'soft', bounceReason: string): Promise<boolean> {
    try {
      // Trouver l'item de tracking par messageId
      const trackingItem = await TrackingService.findTrackingByMessageId(messageId);
      
      if (!trackingItem) {
        console.error(`Aucun tracking trouvé pour le messageId: ${messageId}`);
        return false;
      }
      
      // Mettre à jour le statut
      const additionalData: Partial<EmailTrackingItem> = {
        bounceType,
        bounceReason
      };
      
      const updated = await updateEmailTrackingStatus(trackingItem.id, 'bounced', additionalData);
      
      // Créer un événement
      const event: EmailEvent = {
        id: uuidv4(),
        timestamp: Date.now(),
        eventType: 'bounce',
        messageId,
        campaignId: trackingItem.campaignId,
        recipientEmail: trackingItem.recipientEmail,
        metadata: { type: bounceType, reason: bounceReason }
      };
      
      await createEmailEvent(event);
      
      // Mettre à jour les statistiques de la campagne
      await this.updateCampaignStats(trackingItem.campaignId);
      
      return updated;
    } catch (error) {
      console.error('Erreur lors du tracking de bounce:', error);
      return false;
    }
  }

  /**
   * Met à jour les statistiques d'une campagne
   * @param campaignId ID de la campagne
   * @returns Succès de l'opération
   */
  static async updateCampaignStats(campaignId: string): Promise<boolean> {
    try {
      // Récupérer tous les trackings pour cette campagne
      const trackingResult = await getCampaignTracking(campaignId);
      
      // Récupérer la campagne
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        console.error(`Campagne ${campaignId} non trouvée`);
        return false;
      }
      
      // Mettre à jour les statistiques de la campagne
      campaign.stats = trackingResult;
      
      // Sauvegarder la campagne mise à jour
      await updateEmailCampaign(campaign);
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des statistiques de la campagne ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Trouve un item de tracking par messageId
   * @param messageId ID du message
   * @returns Item de tracking ou null
   */
  private static async findTrackingByMessageId(messageId: string): Promise<EmailTrackingItem | null> {
    try {
      return await getEmailTrackingByMessageId(messageId);
    } catch (error) {
      console.error(`Erreur lors de la recherche du tracking pour le messageId ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Récupère une campagne par son ID
   * @param campaignId ID de la campagne
   * @returns Campagne ou null
   */
  private static async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    try {
      // Récupérer la campagne depuis DynamoDB
      // Ajoutez votre code ici pour récupérer la campagne
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la campagne ${campaignId}:`, error);
      return null;
    }
  }
} 