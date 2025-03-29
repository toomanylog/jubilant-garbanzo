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
  updateEmailCampaign
} from '../models/dynamodb';

const TRACKING_DOMAIN = process.env.REACT_APP_TRACKING_DOMAIN || 'tracking.example.com';
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://api.example.com';

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
    const pixelUrl = `https://${TRACKING_DOMAIN}/p/${trackingId}?c=${encodeURIComponent(campaignId)}&e=${encodeURIComponent(recipientEmail)}`;
    
    return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
  }

  /**
   * Insère le pixel de tracking dans le HTML de l'email
   * @param htmlContent Contenu HTML de l'email
   * @param pixelHtml HTML du pixel de tracking
   * @returns Contenu HTML avec le pixel de tracking
   */
  static insertTrackingPixel(htmlContent: string, pixelHtml: string): string {
    // S'assurer que le HTML a une structure valide
    const hasHtmlStructure = htmlContent.toLowerCase().includes('<!doctype html') && 
      htmlContent.toLowerCase().includes('<html') && 
      htmlContent.toLowerCase().includes('<body');
    
    console.log(`⚠️ Tracking - Structure HTML valide: ${hasHtmlStructure}`);
    
    // Si le HTML contient une balise body fermante, insérer avant
    if (htmlContent.includes('</body>')) {
      console.log('⚠️ Tracking - Insertion du pixel avant </body>');
      return htmlContent.replace('</body>', `${pixelHtml}</body>`);
    }
    
    // Si le HTML contient une balise body ouvrante, insérer à la fin du body
    if (htmlContent.includes('<body')) {
      console.log('⚠️ Tracking - Insertion du pixel à la fin du body (sans balise fermante)');
      // Trouver la position de la dernière balise fermante
      const lastClosingTagPos = htmlContent.lastIndexOf('</');
      if (lastClosingTagPos > 0) {
        return htmlContent.substring(0, lastClosingTagPos) + pixelHtml + htmlContent.substring(lastClosingTagPos);
      }
    }
    
    // Sinon, ajouter à la fin mais envelopper le contenu d'origine dans une structure HTML si nécessaire
    if (!hasHtmlStructure) {
      console.log('⚠️ Tracking - Ajout d\'une structure HTML complète avec pixel');
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif;">
  ${htmlContent}
  ${pixelHtml}
</body>
</html>`;
    }
    
    // En dernier recours, ajouter à la fin
    console.log('⚠️ Tracking - Ajout du pixel à la fin du contenu existant');
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
    // Regex pour trouver les liens - version améliorée pour capturer plus de cas
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(['"])((?!#|mailto:|tel:)[^'"]+)\1([^>]*)>([\s\S]*?)<\/a>/gi;
    
    console.log(`⚠️ Tracking - Analyse des liens dans le contenu HTML`);
    
    // Compter les liens trouvés
    let linkCount = 0;
    let trackedHtml = htmlContent.replace(linkRegex, (match, quote, url, attrs, text) => {
      // Ignorer les liens d'ancre, mailto et tel à nouveau (bien que la regex les exclue déjà)
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return match;
      }
      
      // Générer un ID unique pour ce lien
      const linkId = uuidv4();
      linkCount++;
      
      // Créer l'URL de redirection
      const redirectUrl = `https://${TRACKING_DOMAIN}/r/${linkId}?c=${encodeURIComponent(campaignId)}&e=${encodeURIComponent(recipientEmail)}&m=${encodeURIComponent(messageId)}&u=${encodeURIComponent(url)}`;
      
      // Remplacer le lien en préservant les attributs et le texte
      return `<a href="${redirectUrl}"${attrs}>${text}</a>`;
    });
    
    console.log(`⚠️ Tracking - ${linkCount} liens ont été trackés`);
    
    return trackedHtml;
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
        return trackingItem;
      }
      
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
    console.log(`⚠️ Tracking - Préparation du HTML avec tracking pour ${recipientEmail}`);
    
    // Vérifier si le contenu a une structure HTML complète
    const hasFullStructure = htmlContent.toLowerCase().includes('<!doctype html') && 
      htmlContent.toLowerCase().includes('<html') && 
      htmlContent.toLowerCase().includes('<head') && 
      htmlContent.toLowerCase().includes('<body');
    
    console.log(`⚠️ Tracking - Structure HTML complète détectée: ${hasFullStructure}`);
    
    // Assurer que le contenu est correctement formaté en HTML si ce n'est pas déjà le cas
    let formattedHtml = htmlContent;
    if (!hasFullStructure) {
      console.log(`⚠️ Tracking - Application d'une structure HTML complète`);
      formattedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif;">
  ${htmlContent}
</body>
</html>`;
    }
    
    // Générer le pixel de tracking
    const pixelHtml = this.generateTrackingPixel(campaignId, recipientEmail, trackingItem.pixelId);
    
    // D'abord tracker les liens
    let trackedHtml = this.trackLinks(formattedHtml, campaignId, recipientEmail, messageId);
    
    // Ensuite insérer le pixel
    trackedHtml = this.insertTrackingPixel(trackedHtml, pixelHtml);
    
    // Vérifier que le contenu final a une structure HTML complète
    const finalHasFullStructure = trackedHtml.toLowerCase().includes('<!doctype html') && 
      trackedHtml.toLowerCase().includes('<html') && 
      trackedHtml.toLowerCase().includes('<head') && 
      trackedHtml.toLowerCase().includes('<body');
    
    console.log(`⚠️ Tracking - Structure HTML finale complète: ${finalHasFullStructure}`);
    
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
   * Met à jour les statistiques de la campagne
   * @param campaignId ID de la campagne
   * @returns Succès de l'opération
   */
  static async updateCampaignStats(campaignId: string): Promise<boolean> {
    try {
      // Récupérer les statistiques actuelles à partir des données de tracking
      const stats = await getCampaignTracking(campaignId);
      
      // Mettre à jour la campagne en base de données
      // Note: On suppose que la fonction updateCampaignById existe ou utiliser updateEmailCampaign
      const campaign = await TrackingService.getCampaign(campaignId);
      if (!campaign) {
        return false;
      }
      
      campaign.stats = stats;
      campaign.updatedAt = new Date().toISOString();
      
      return await updateEmailCampaign(campaign);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques de la campagne:', error);
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
      // Cette fonction est supposée exister dans models/dynamodb.ts
      // Si elle n'existe pas, il faudrait l'implémenter
      return null; // À remplacer par un appel à la fonction réelle
    } catch (error) {
      console.error('Erreur lors de la recherche de tracking par messageId:', error);
      return null;
    }
  }

  /**
   * Récupère une campagne par ID
   * @param campaignId ID de la campagne
   * @returns Campagne ou null
   */
  private static async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    try {
      // Cette fonction devrait utiliser une fonction existante comme getEmailCampaignById
      return null; // À remplacer par un appel à la fonction réelle
    } catch (error) {
      console.error('Erreur lors de la récupération de la campagne:', error);
      return null;
    }
  }
} 