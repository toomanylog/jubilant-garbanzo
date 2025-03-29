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
export interface SmtpProvider {
  providerId: string;
  userId: string;
  providerType: 'aws_ses' | 'custom_smtp' | 'office365' | 'sendgrid' | 'mailjet';
  name: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  region?: string;
  isDefault: boolean;
  requiresTls?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface pour les templates d'emails
export interface EmailTemplate {
  templateId: string;
  userId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
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
}

export interface EmailCampaign {
  campaignId: string;
  userId: string;
  name: string;
  templateId: string;
  providerId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats: EmailCampaignStats;
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