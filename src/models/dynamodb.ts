import { dynamoDB } from '../aws-config';

// Interface pour les utilisateurs
export interface User {
  userId: string;
  email: string;
  fullName: string;
  plan?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface pour les fournisseurs SMTP
export interface SmtpSender {
  email: string;
  name: string;
  isActive: boolean;
}

export interface SmtpProvider {
  providerId: string;
  userId: string;
  name: string;
  providerType: 'aws_ses' | 'custom_smtp' | 'office365' | 'sendgrid' | 'mailjet';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  secure?: boolean;
  apiKey?: string;
  region?: string;
  isDefault: boolean;
  requiresTls?: boolean;
  createdAt: string;
  updatedAt: string;
  // Paramètres de quotas et limites d'envoi
  sendingRatePerSecond?: number;
  sendingRatePerMinute?: number;
  sendingRatePerHour?: number;
  sendingRatePerDay?: number;
  dailyQuota?: number;
  totalSentToday?: number;
  lastQuotaReset?: string; // Date de la dernière réinitialisation du quota
  isActive?: boolean;      // Indique si le fournisseur est actif ou inactif
  priority?: number;       // Priorité du fournisseur (plus petit = plus prioritaire)
}

// Interface pour les templates d'emails
export interface EmailTemplate {
  templateId: string;
  userId: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
}

// Interface pour les campagnes email
export interface EmailCampaignStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complaints: number;
  // Ajout de nouvelles statistiques
  softBounces: number;
  hardBounces: number;
  clickRate: number;
  openRate: number;
  deliveryRate: number;
}

// Interface pour les expéditeurs
export interface Sender {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  bounceCount?: number;
  complaintsCount?: number;
  lastUsed?: string; // Date de dernière utilisation
}

// Interface pour la campagne email avec les options de rotation
export interface EmailCampaign {
  campaignId: string;
  userId: string;
  name: string;
  templateId: string | string[]; // Peut être un ID unique ou un tableau d'IDs
  smtpProviderId: string | string[]; // Peut être un ID unique ou un tableau d'IDs
  subject: string | string[]; // Peut être un sujet unique ou un tableau de sujets
  fromName: string | string[]; // Peut être un nom unique ou un tableau de noms
  fromEmail: string | string[]; // Peut être un email unique ou un tableau d'emails
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'paused';
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats: EmailCampaignStats;
  content?: string; // Champ optionnel pour le contenu personnalisé
  // Options de rotation
  rotationOptions?: {
    templateRotation: 'sequential' | 'random';
    smtpRotation: 'sequential' | 'random' | 'balanced';
    subjectRotation: 'sequential' | 'random' | 'abTesting';
    senderRotation: 'sequential' | 'random' | 'roundRobin';
  };
  // Paramètres d'envoi
  sendingOptions?: {
    ratePerSecond?: number;
    ratePerMinute?: number;
    ratePerHour?: number;
    ratePerDay?: number;
    maxSendAttempts?: number;
    rescheduleFailedAfterMinutes?: number;
    enableThrottling?: boolean;
    respectProviderLimits?: boolean;
  };
  // Paramètres de test A/B
  abTestingOptions?: {
    enabled: boolean;
    testSize: number; // Pourcentage des destinataires pour le test
    winningCriteria: 'opens' | 'clicks';
    waitTime: number; // Heures d'attente avant d'envoyer au reste
    winner?: string; // ID du template, sujet ou sender gagnant
  };
}

// Interface pour les paramètres utilisateur
export interface UserSettings {
  userId: string;
  testEmails: string[];
  createdAt: string;
  updatedAt: string;
}

// Interface pour le tracking des emails
export interface EmailTrackingItem {
  id: string; // Combinaison de campaignId:recipientEmail
  campaignId: string;
  recipientEmail: string;
  messageId: string;
  sentTimestamp: number;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  openedTimestamp: number | null;
  clickedTimestamp: number | null;
  clickedLinks: {url: string, timestamp: number}[];
  templateId?: string;
  bounceType?: 'hard' | 'soft';
  bounceReason?: string;
  deliveredTimestamp?: number | null;
  pixelId: string; // ID unique pour le pixel de tracking
}

// Interface pour les événements de tracking (webhooks)
export interface EmailEvent {
  id: string;
  timestamp: number;
  eventType: 'send' | 'delivery' | 'open' | 'click' | 'bounce' | 'complaint';
  messageId: string;
  campaignId: string;
  recipientEmail: string;
  metadata?: Record<string, any>;
}

// Interface pour les paramètres de suivi
export interface TrackingSettings {
  trackOpens: boolean;
  trackClicks: boolean;
  trackBounces: boolean;
  pixelEnabled: boolean;
  linkTracking: boolean;
}

// Fonctions pour interagir avec DynamoDB

// Utilisateurs
export const getUserById = async (userId: string): Promise<User | null> => {
  const params = {
    TableName: 'Users',
    Key: {
      userId
    }
  };

  try {
    const result = await dynamoDB.get(params).promise();
    return result.Item as User || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

export const createUser = async (user: User): Promise<boolean> => {
  const params = {
    TableName: 'Users',
    Item: user
  };

  try {
    await dynamoDB.put(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return false;
  }
};

// Fonction pour mettre à jour un utilisateur existant
export const updateUser = async (user: User): Promise<boolean> => {
  const params = {
    TableName: 'Users',
    Item: user
  };

  try {
    await dynamoDB.put(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return false;
  }
};

// Alias de getUserById pour la compatibilité
export const getUser = getUserById;

// Fournisseurs SMTP
export const getSmtpProvidersByUserId = async (userId: string): Promise<SmtpProvider[]> => {
  try {
    console.log('⚠️ DEBUG getSmtpProvidersByUserId - userId:', userId);
    
    const params = {
      TableName: 'SmtpProviders',
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    console.log('⚠️ DEBUG getSmtpProvidersByUserId - params:', JSON.stringify(params));
    
    const result = await dynamoDB.query(params).promise();
    console.log('⚠️ DEBUG getSmtpProvidersByUserId - result:', JSON.stringify(result));
    
    return result.Items as SmtpProvider[] || [];
  } catch (error) {
    console.error('⚠️ ERROR getSmtpProvidersByUserId:', error);
    return [];
  }
};

export const createSmtpProvider = async (provider: SmtpProvider): Promise<boolean> => {
  try {
    console.log('⚠️ DEBUG createSmtpProvider - provider:', JSON.stringify(provider));
    
    const params = {
      TableName: 'SmtpProviders',
      Item: provider
    };
    
    console.log('⚠️ DEBUG createSmtpProvider - params:', JSON.stringify(params));
    
    await dynamoDB.put(params).promise();
    console.log('⚠️ DEBUG createSmtpProvider - Opération réussie');
    
    return true;
  } catch (error) {
    console.error('⚠️ ERROR createSmtpProvider:', error);
    return false;
  }
};

// Obtenir un fournisseur SMTP par son ID
export const getSmtpProviderById = async (providerId: string): Promise<SmtpProvider> => {
  console.log('⚠️ DEBUG getSmtpProviderById - Début de la requête, providerId:', providerId);
  
  const params = {
    TableName: 'SmtpProviders',
    Key: {
      providerId: providerId
    }
  };

  try {
    console.log('⚠️ DEBUG getSmtpProviderById - Paramètres de la requête:', JSON.stringify(params));
    
    const result = await dynamoDB.get(params).promise();
    console.log('⚠️ DEBUG getSmtpProviderById - Résultat brut de la requête:', JSON.stringify(result));
    
    if (!result.Item) {
      console.error('⚠️ ERROR getSmtpProviderById - Provider non trouvé:', providerId);
      throw new Error('Fournisseur SMTP non trouvé');
    }
    
    console.log('⚠️ DEBUG getSmtpProviderById - Provider trouvé:', result.Item.name);
    return result.Item as SmtpProvider;
  } catch (error) {
    console.error('⚠️ ERROR getSmtpProviderById - Erreur complète:', error);
    throw error;
  }
};

// Templates d'emails
export const getEmailTemplatesByUserId = async (userId: string): Promise<EmailTemplate[]> => {
  const params = {
    TableName: 'EmailTemplates',
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  try {
    const result = await dynamoDB.query(params).promise();
    return result.Items as EmailTemplate[] || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error);
    return [];
  }
};

export const createEmailTemplate = async (template: EmailTemplate): Promise<boolean> => {
  console.log('⚠️ DEBUG createEmailTemplate - template:', JSON.stringify({
    ...template,
    htmlContent: template.htmlContent ? `[${template.htmlContent.length} caractères]` : 'null'
  }));

  // Vérifier que le htmlContent n'est pas vide
  if (!template.htmlContent) {
    console.error('⚠️ ERROR createEmailTemplate: htmlContent est vide');
  }

  const params = {
    TableName: 'EmailTemplates',
    Item: template
  };

  console.log('⚠️ DEBUG createEmailTemplate - params:', JSON.stringify({
    ...params,
    Item: {
      ...params.Item,
      htmlContent: params.Item.htmlContent ? `[${params.Item.htmlContent.length} caractères]` : 'null'
    }
  }));

  try {
    await dynamoDB.put(params).promise();
    console.log('⚠️ DEBUG createEmailTemplate - Opération réussie');
    return true;
  } catch (error) {
    console.error('Erreur lors de la création du template:', error);
    return false;
  }
};

// Mettre à jour un template d'email existant
export const updateEmailTemplate = async (template: EmailTemplate): Promise<boolean> => {
  console.log('⚠️ DEBUG updateEmailTemplate - template:', JSON.stringify({
    ...template,
    htmlContent: template.htmlContent ? `[${template.htmlContent.length} caractères]` : 'null'
  }));

  // Vérifier que le htmlContent n'est pas vide
  if (!template.htmlContent) {
    console.error('⚠️ ERROR updateEmailTemplate: htmlContent est vide');
  }

  const params = {
    TableName: 'EmailTemplates',
    Item: template
  };

  console.log('⚠️ DEBUG updateEmailTemplate - params:', JSON.stringify({
    ...params,
    Item: {
      ...params.Item,
      htmlContent: params.Item.htmlContent ? `[${params.Item.htmlContent.length} caractères]` : 'null'
    }
  }));

  try {
    await dynamoDB.put(params).promise();
    console.log('⚠️ DEBUG updateEmailTemplate - Opération réussie');
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du template:', error);
    return false;
  }
};

// Obtenir un template d'email par son ID
export const getEmailTemplateById = async (templateId: string): Promise<EmailTemplate | null> => {
  console.log('⚠️ DEBUG getEmailTemplateById - Début de la requête, templateId:', templateId);
  
  const params = {
    TableName: 'EmailTemplates',
    Key: {
      templateId
    }
  };

  try {
    console.log('⚠️ DEBUG getEmailTemplateById - Paramètres de la requête:', JSON.stringify(params));
    
    const result = await dynamoDB.get(params).promise();
    console.log('⚠️ DEBUG getEmailTemplateById - Résultat brut de la requête:', JSON.stringify(result));
    
    if (!result.Item) {
      console.log('⚠️ DEBUG getEmailTemplateById - Template non trouvé');
      return null;
    }
    
    const template = result.Item as EmailTemplate;
    console.log('⚠️ DEBUG getEmailTemplateById - Template trouvé:', template.name);
    console.log('⚠️ DEBUG getEmailTemplateById - htmlContent présent:', !!template.htmlContent);
    console.log('⚠️ DEBUG getEmailTemplateById - taille htmlContent:', template.htmlContent?.length || 0);
    
    return template;
  } catch (error) {
    console.error('⚠️ ERROR getEmailTemplateById - Erreur complète:', error);
    return null;
  }
};

// Supprimer un template d'email
export const deleteEmailTemplate = async (templateId: string): Promise<boolean> => {
  const params = {
    TableName: 'EmailTemplates',
    Key: {
      templateId
    }
  };

  try {
    await dynamoDB.delete(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du template:', error);
    return false;
  }
};

// Campagnes email
export const getEmailCampaignsByUserId = async (userId: string): Promise<EmailCampaign[]> => {
  const params = {
    TableName: 'EmailCampaigns',
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  try {
    const result = await dynamoDB.query(params).promise();
    return result.Items as EmailCampaign[] || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    return [];
  }
};

export const getEmailCampaignById = async (campaignId: string): Promise<EmailCampaign | null> => {
  const params = {
    TableName: 'EmailCampaigns',
    Key: {
      campaignId
    }
  };

  try {
    const result = await dynamoDB.get(params).promise();
    return result.Item as EmailCampaign || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la campagne:', error);
    return null;
  }
};

export const createEmailCampaign = async (campaign: EmailCampaign): Promise<boolean> => {
  const params = {
    TableName: 'EmailCampaigns',
    Item: campaign
  };

  try {
    await dynamoDB.put(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    return false;
  }
};

export const updateEmailCampaign = async (campaign: EmailCampaign): Promise<boolean> => {
  const params = {
    TableName: 'EmailCampaigns',
    Item: campaign
  };

  try {
    await dynamoDB.put(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    return false;
  }
};

export const deleteEmailCampaign = async (campaignId: string): Promise<boolean> => {
  const params = {
    TableName: 'EmailCampaigns',
    Key: {
      campaignId
    }
  };

  try {
    await dynamoDB.delete(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    return false;
  }
};

// Mettre à jour un fournisseur SMTP existant
export const updateSmtpProvider = async (provider: SmtpProvider): Promise<boolean> => {
  // Si le mot de passe est vide, ne pas le mettre à jour pour préserver la valeur existante
  if (provider.password === '') {
    // Récupérer la valeur actuelle du mot de passe
    const currentProvider = await getSmtpProviderById(provider.providerId);
    provider.password = currentProvider.password;
  }

  const params = {
    TableName: 'SmtpProviders',
    Item: provider
  };

  try {
    await dynamoDB.put(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fournisseur SMTP:', error);
    return false;
  }
};

// Supprime un fournisseur SMTP
export const deleteSmtpProvider = async (providerId: string): Promise<boolean> => {
  try {
    console.log(`⚠️ DEBUG deleteSmtpProvider - Suppression du fournisseur avec ID: ${providerId}`);
    
    // Appeler réellement l'API DynamoDB pour supprimer le fournisseur
    const params = {
      TableName: 'SmtpProviders',
      Key: {
        providerId: providerId
      }
    };
    
    console.log('⚠️ DEBUG deleteSmtpProvider - params:', JSON.stringify(params));
    
    await dynamoDB.delete(params).promise();
    console.log('⚠️ DEBUG deleteSmtpProvider - Suppression réussie');
    
    return true;
  } catch (error) {
    console.error('⚠️ ERROR deleteSmtpProvider:', error);
    return false;
  }
};

// Fonction pour récupérer les paramètres utilisateur
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const params = {
    TableName: 'UserSettings',
    Key: {
      userId
    }
  };

  try {
    const result = await dynamoDB.get(params).promise();
    return result.Item as UserSettings || null;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres utilisateur:', error);
    return null;
  }
};

// Fonction pour sauvegarder les paramètres utilisateur
export const saveUserSettings = async (settings: UserSettings): Promise<boolean> => {
  const params = {
    TableName: 'UserSettings',
    Item: settings
  };

  try {
    await dynamoDB.put(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres utilisateur:', error);
    return false;
  }
};

// Fonction pour mettre à jour les adresses email de test
export const updateTestEmails = async (userId: string, testEmails: string[]): Promise<boolean> => {
  try {
    // Récupérer les paramètres existants ou créer une nouvelle entrée
    let settings = await getUserSettings(userId);
    const now = new Date().toISOString();
    
    if (!settings) {
      settings = {
        userId,
        testEmails,
        createdAt: now,
        updatedAt: now
      };
    } else {
      settings = {
        ...settings,
        testEmails,
        updatedAt: now
      };
    }
    
    return await saveUserSettings(settings);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des adresses email de test:', error);
    return false;
  }
};

// Fonctions pour le tracking des emails
export const createEmailTrackingItem = async (item: EmailTrackingItem): Promise<boolean> => {
  const params = {
    TableName: 'EmailTracking',
    Item: item
  };

  try {
    await dynamoDB.put(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de l\'item de tracking:', error);
    return false;
  }
};

export const getEmailTrackingByMessageId = async (messageId: string): Promise<EmailTrackingItem | null> => {
  const params = {
    TableName: 'EmailTracking',
    IndexName: 'MessageIdIndex',
    KeyConditionExpression: 'messageId = :messageId',
    ExpressionAttributeValues: {
      ':messageId': messageId
    },
    Limit: 1
  };

  try {
    const result = await dynamoDB.query(params).promise();
    return (result.Items && result.Items.length > 0) ? result.Items[0] as EmailTrackingItem : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du tracking par messageId:', error);
    return null;
  }
};

export const getEmailTrackingByCampaignId = async (campaignId: string, limit = 100, lastEvaluatedKey?: any): Promise<{items: EmailTrackingItem[], lastEvaluatedKey?: any}> => {
  const params: any = {
    TableName: 'EmailTracking',
    IndexName: 'CampaignIdIndex',
    KeyConditionExpression: 'campaignId = :campaignId',
    ExpressionAttributeValues: {
      ':campaignId': campaignId
    },
    Limit: limit
  };

  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  try {
    const result = await dynamoDB.query(params).promise();
    return {
      items: result.Items as EmailTrackingItem[],
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du tracking par campaignId:', error);
    return { items: [] };
  }
};

export const updateEmailTrackingStatus = async (id: string, status: EmailTrackingItem['status'], additionalData?: Partial<EmailTrackingItem>): Promise<boolean> => {
  const now = Date.now();
  let updateExpression = 'SET #status = :status, updatedAt = :updatedAt';
  const expressionAttributeNames: Record<string, string> = {
    '#status': 'status'
  };
  const expressionAttributeValues: Record<string, any> = {
    ':status': status,
    ':updatedAt': now
  };

  // Ajouter des timestamps spécifiques en fonction du statut
  if (status === 'opened' && !additionalData?.openedTimestamp) {
    updateExpression += ', openedTimestamp = :openedTimestamp';
    expressionAttributeValues[':openedTimestamp'] = now;
  }

  if (status === 'clicked' && !additionalData?.clickedTimestamp) {
    updateExpression += ', clickedTimestamp = :clickedTimestamp';
    expressionAttributeValues[':clickedTimestamp'] = now;
  }

  if (status === 'delivered' && !additionalData?.deliveredTimestamp) {
    updateExpression += ', deliveredTimestamp = :deliveredTimestamp';
    expressionAttributeValues[':deliveredTimestamp'] = now;
  }

  // Ajouter des données supplémentaires si fournies
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'campaignId' && key !== 'recipientEmail') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression += `, ${attrName} = ${attrValue}`;
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });
  }

  const params = {
    TableName: 'EmailTracking',
    Key: { id },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    await dynamoDB.update(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de tracking:', error);
    return false;
  }
};

export const addClickToEmailTracking = async (id: string, url: string): Promise<boolean> => {
  const now = Date.now();
  const newClick = { url, timestamp: now };
  
  const params = {
    TableName: 'EmailTracking',
    Key: { id },
    UpdateExpression: 'SET #status = :status, clickedTimestamp = :clickedTimestamp, clickedLinks = list_append(if_not_exists(clickedLinks, :emptyList), :newClick)',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': 'clicked',
      ':clickedTimestamp': now,
      ':emptyList': [],
      ':newClick': [newClick]
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    await dynamoDB.update(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du clic au tracking:', error);
    return false;
  }
};

// Fonction pour récupérer les statistiques d'une campagne à partir des données de tracking
export const getCampaignTracking = async (campaignId: string): Promise<EmailCampaignStats> => {
  const baseStats: EmailCampaignStats = {
    total: 0,
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
  };

  try {
    // Récupérer tous les items de tracking pour cette campagne
    let allItems: EmailTrackingItem[] = [];
    let lastKey: any = undefined;
    
    do {
      const result = await getEmailTrackingByCampaignId(campaignId, 1000, lastKey);
      allItems = [...allItems, ...result.items];
      lastKey = result.lastEvaluatedKey;
    } while (lastKey);

    // Calculer les statistiques
    const stats = allItems.reduce((acc, item) => {
      acc.total++;
      
      if (item.status === 'sent' || item.sentTimestamp) {
        acc.sent++;
      }
      
      if (item.status === 'delivered' || item.deliveredTimestamp) {
        acc.delivered++;
      }
      
      if (item.status === 'opened' || item.openedTimestamp) {
        acc.opened++;
      }
      
      if (item.status === 'clicked' || item.clickedTimestamp) {
        acc.clicked++;
      }
      
      if (item.status === 'bounced') {
        acc.bounced++;
        if (item.bounceType === 'soft') {
          acc.softBounces++;
        } else if (item.bounceType === 'hard') {
          acc.hardBounces++;
        }
      }
      
      if (item.status === 'complained') {
        acc.complaints++;
      }
      
      return acc;
    }, { ...baseStats });

    // Calculer les taux
    if (stats.sent > 0) {
      stats.deliveryRate = parseFloat(((stats.delivered / stats.sent) * 100).toFixed(2));
    }
    
    if (stats.delivered > 0) {
      stats.openRate = parseFloat(((stats.opened / stats.delivered) * 100).toFixed(2));
      stats.clickRate = parseFloat(((stats.clicked / stats.delivered) * 100).toFixed(2));
    }

    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de tracking:', error);
    return baseStats;
  }
};

// Fonction pour créer ou mettre à jour un événement d'email
export const createEmailEvent = async (event: EmailEvent): Promise<boolean> => {
  const params = {
    TableName: 'EmailEvents',
    Item: event
  };

  try {
    await dynamoDB.put(params).promise();
    
    // Mettre également à jour l'item de tracking correspondant
    const trackingId = `${event.campaignId}:${event.recipientEmail}`;
    
    switch (event.eventType) {
      case 'delivery':
        await updateEmailTrackingStatus(trackingId, 'delivered');
        break;
      case 'open':
        await updateEmailTrackingStatus(trackingId, 'opened');
        break;
      case 'click':
        if (event.metadata?.url) {
          await addClickToEmailTracking(trackingId, event.metadata.url);
        } else {
          await updateEmailTrackingStatus(trackingId, 'clicked');
        }
        break;
      case 'bounce':
        await updateEmailTrackingStatus(trackingId, 'bounced', {
          bounceType: event.metadata?.type,
          bounceReason: event.metadata?.reason
        });
        break;
      case 'complaint':
        await updateEmailTrackingStatus(trackingId, 'complained');
        break;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement email:', error);
    return false;
  }
}; 