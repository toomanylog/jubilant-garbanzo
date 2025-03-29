import AWS from 'aws-sdk';
import axios from 'axios';
import { SmtpProvider, SmtpSender } from '../models/dynamodb';

// Interface pour les options d'envoi d'email
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from: {
    email: string;
    name: string;
  } | string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  variables?: Record<string, string>;
}

// Classe abstraite pour tous les fournisseurs SMTP
abstract class SmtpService {
  protected provider: SmtpProvider;

  constructor(provider: SmtpProvider) {
    this.provider = provider;
  }

  abstract sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// AWS SES Service
export class AwsSesService extends SmtpService {
  private ses: AWS.SES;
  private senderIndex: number = 0;

  constructor(provider: SmtpProvider) {
    super(provider);
    
    // Utiliser la configuration globale AWS pour la région et les identifiants
    // mais permettre de les remplacer par ceux du fournisseur si nécessaire
    const awsConfig = AWS.config;
    const region = provider.region || awsConfig.region || 'us-east-1';
    
    console.log('⚠️ Configuration SES - Utilisation de la région:', region);
    console.log('⚠️ Configuration SES - Access Key fournie par le fournisseur:', !!provider.username);
    console.log('⚠️ Configuration SES - Access Key globale:', !!awsConfig.credentials?.accessKeyId);
    
    // Mise à jour de l'hôte SMTP si non spécifié
    if (!provider.host && provider.region) {
      console.log(`⚠️ Configuration SES - Mise à jour automatique de l'hôte SMTP pour la région ${region}`);
      provider.host = `email-smtp.${region}.amazonaws.com`;
    }
    
    console.log('⚠️ Configuration SES - Hôte SMTP utilisé:', provider.host || `email-smtp.${region}.amazonaws.com`);
    
    // Création des informations d'authentification
    const credentials = provider.username && provider.password ? {
      accessKeyId: provider.username,
      secretAccessKey: provider.password
    } : awsConfig.credentials;
    
    // Vérifier les identifiants
    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
      console.error('⚠️ Configuration SES - Identifiants AWS manquants ou incomplets');
    } else {
      console.log('⚠️ Configuration SES - Identifiants valides disponibles');
    }
    
    // Créer une instance SES avec les identifiants et la région appropriés
    this.ses = new AWS.SES({
      region: region,
      credentials: credentials,
      endpoint: `email-smtp.${region}.amazonaws.com`,
      // Ne pas définir d'endpoint personnalisé pour permettre à AWS SDK de choisir le bon endpoint basé sur la région
      // Cela évite les erreurs de signature
    });
    
    console.log(`⚠️ Configuration SES - Instance SES créée pour la région ${region}`);
  }

  // Obtient le prochain expéditeur selon la stratégie de rotation
  private getNextSender(): SmtpSender | null {
    // Si aucun expéditeur n'est défini ou si la rotation est désactivée, retourner null
    if (!this.provider.senders || this.provider.senders.length === 0 || !this.provider.senderRotationEnabled) {
      return null;
    }

    // Filtrer les expéditeurs actifs
    const activeSenders = this.provider.senders.filter(sender => sender.isActive);
    if (activeSenders.length === 0) {
      return null;
    }

    // Sélectionner le prochain expéditeur selon la stratégie de rotation
    let sender: SmtpSender;

    if (this.provider.senderRotationType === 'random') {
      // Sélection aléatoire
      const randomIndex = Math.floor(Math.random() * activeSenders.length);
      sender = activeSenders[randomIndex];
    } else {
      // Sélection séquentielle (par défaut)
      if (this.senderIndex >= activeSenders.length) {
        this.senderIndex = 0;
      }
      sender = activeSenders[this.senderIndex];
      this.senderIndex++;
    }

    console.log(`⚠️ Rotation d'expéditeur - Utilisation de: ${sender.name} <${sender.email}>`);
    return sender;
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Convertir 'to' en tableau si c'est une chaîne
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      
      // Préparer l'expéditeur en tenant compte de la rotation
      let source: string;
      const nextSender = this.getNextSender();
      
      if (nextSender) {
        // Utiliser l'expéditeur obtenu par rotation
        source = `${nextSender.name} <${nextSender.email}>`;
      } else if (typeof options.from === 'string') {
        // Utiliser l'expéditeur fourni dans les options
        source = options.from;
      } else {
        // Utiliser l'expéditeur fourni dans les options (format objet)
        source = `${options.from.name} <${options.from.email}>`;
      }
      
      console.log(`⚠️ Envoi d'email - De: ${source}`);

      const params = {
        Source: source,
        Destination: {
          ToAddresses: toAddresses
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: options.html,
              Charset: 'UTF-8'
            },
            Text: {
              Data: options.text || '',
              Charset: 'UTF-8'
            }
          }
        }
      };

      const result = await this.ses.sendEmail(params).promise();
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi d\'email via AWS SES:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Service pour Sendgrid
export class SendgridService extends SmtpService {
  private apiKey: string;

  constructor(provider: SmtpProvider) {
    super(provider);
    // Utilisation de l'API key fournie par l'utilisateur
    this.apiKey = provider.apiKey || '';
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Convertir 'to' en tableau si c'est une chaîne
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      
      // Préparer l'expéditeur
      let fromEmail: string;
      let fromName: string;
      
      if (typeof options.from === 'string') {
        // Extraction du nom et de l'email à partir du format "Nom <email@exemple.com>"
        const matches = options.from.match(/(.*?)\s*<(.+?)>/);
        if (matches && matches.length === 3) {
          fromName = matches[1].trim();
          fromEmail = matches[2].trim();
        } else {
          fromName = '';
          fromEmail = options.from.trim();
        }
      } else {
        fromEmail = options.from.email;
        fromName = options.from.name;
      }

      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [
            {
              to: toArray.map(email => ({ email })),
              subject: options.subject,
              dynamic_template_data: options.variables
            }
          ],
          from: {
            email: fromEmail,
            name: fromName
          },
          reply_to: options.replyTo ? { email: options.replyTo } : undefined,
          content: [
            {
              type: 'text/html',
              value: options.html
            },
            {
              type: 'text/plain',
              value: options.text || ''
            }
          ],
          attachments: options.attachments
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.headers['x-message-id']
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi d\'email via Sendgrid:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

// Service pour Mailjet
export class MailjetService extends SmtpService {
  private apiKey: string;
  private apiSecret: string;

  constructor(provider: SmtpProvider) {
    super(provider);
    // Utilisation des identifiants fournis par l'utilisateur
    this.apiKey = provider.username || '';
    this.apiSecret = provider.password || '';
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Convertir 'to' en tableau si c'est une chaîne
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      
      // Préparer l'expéditeur
      let fromEmail: string;
      let fromName: string;
      
      if (typeof options.from === 'string') {
        // Extraction du nom et de l'email à partir du format "Nom <email@exemple.com>"
        const matches = options.from.match(/(.*?)\s*<(.+?)>/);
        if (matches && matches.length === 3) {
          fromName = matches[1].trim();
          fromEmail = matches[2].trim();
        } else {
          fromName = '';
          fromEmail = options.from.trim();
        }
      } else {
        fromEmail = options.from.email;
        fromName = options.from.name;
      }

      // Définir le type de réponse attendu de Mailjet
      interface MailjetResponse {
        Messages: Array<{
          Status: string;
          To: Array<{
            Email: string;
            MessageID: string;
          }>;
          Errors?: Array<{
            ErrorIdentifier: string;
            ErrorCode: string;
            StatusCode: number;
          }>;
          MessageID?: string;
        }>;
      }

      const response = await axios.post<MailjetResponse>(
        'https://api.mailjet.com/v3.1/send',
        {
          Messages: [
            {
              From: {
                Email: fromEmail,
                Name: fromName
              },
              To: toArray.map((email: string) => ({ Email: email })),
              Subject: options.subject,
              HTMLPart: options.html,
              TextPart: options.text || '',
              ReplyTo: options.replyTo ? { Email: options.replyTo } : undefined,
              Attachments: options.attachments ? options.attachments.map(att => ({
                ContentType: att.contentType,
                Filename: att.filename,
                Base64Content: att.content
              })) : undefined,
              Variables: options.variables
            }
          ]
        },
        {
          auth: {
            username: this.apiKey,
            password: this.apiSecret
          }
        }
      );

      return {
        success: true,
        messageId: response.data.Messages[0]?.MessageID || String(Date.now())
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi d\'email via Mailjet:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

// Service SMTP personnalisé
export class CustomSmtpService extends SmtpService {
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Convertir 'to' en tableau si c'est une chaîne
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      
      // Préparer l'expéditeur
      let fromEmail: string;
      let fromName: string;
      
      if (typeof options.from === 'string') {
        // Extraction du nom et de l'email à partir du format "Nom <email@exemple.com>"
        const matches = options.from.match(/(.*?)\s*<(.+?)>/);
        if (matches && matches.length === 3) {
          fromName = matches[1].trim();
          fromEmail = matches[2].trim();
        } else {
          fromName = '';
          fromEmail = options.from.trim();
        }
      } else {
        fromEmail = options.from.email;
        fromName = options.from.name;
      }

      // Envoi de la demande au backend
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerType: 'custom_smtp',
          smtpConfig: {
            host: this.provider.host,
            port: this.provider.port,
            username: this.provider.username,
            password: this.provider.password,
            requireTls: this.provider.requiresTls
          },
          emailOptions: {
            to: toArray,
            from: {
              email: fromEmail,
              name: fromName
            },
            subject: options.subject,
            html: options.html,
            text: options.text,
            replyTo: options.replyTo,
            attachments: options.attachments
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi d\'email');
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId || `custom-smtp-${Date.now()}`
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi d\'email via SMTP personnalisé:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Service Office 365
export class Office365Service extends SmtpService {
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Convertir 'to' en tableau si c'est une chaîne
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      
      // Préparer l'expéditeur
      let fromEmail: string;
      let fromName: string;
      
      if (typeof options.from === 'string') {
        // Extraction du nom et de l'email à partir du format "Nom <email@exemple.com>"
        const matches = options.from.match(/(.*?)\s*<(.+?)>/);
        if (matches && matches.length === 3) {
          fromName = matches[1].trim();
          fromEmail = matches[2].trim();
        } else {
          fromName = '';
          fromEmail = options.from.trim();
        }
      } else {
        fromEmail = options.from.email;
        fromName = options.from.name;
      }

      // Envoi de la demande au backend
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerType: 'office365',
          smtpConfig: {
            host: this.provider.host || 'smtp.office365.com',
            port: this.provider.port || 587,
            username: this.provider.username,
            password: this.provider.password,
            requireTls: true
          },
          emailOptions: {
            to: toArray,
            from: {
              email: fromEmail,
              name: fromName
            },
            subject: options.subject,
            html: options.html,
            text: options.text,
            replyTo: options.replyTo,
            attachments: options.attachments
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi d\'email');
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId || `office365-${Date.now()}`
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi d\'email via Office 365:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Factory pour créer le service SMTP approprié
export const createSmtpService = (provider: SmtpProvider): SmtpService => {
  switch (provider.providerType) {
    case 'aws_ses':
      return new AwsSesService(provider);
    case 'sendgrid':
      return new SendgridService(provider);
    case 'mailjet':
      return new MailjetService(provider);
    case 'office365':
      return new Office365Service(provider);
    case 'custom_smtp':
    default:
      return new CustomSmtpService(provider);
  }
}; 