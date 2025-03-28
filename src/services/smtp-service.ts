import AWS from 'aws-sdk';
import axios from 'axios';
import { SmtpProvider } from '../models/dynamodb';

// Interface pour les options d'envoi d'email
export interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from: {
    email: string;
    name: string;
  };
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

  constructor(provider: SmtpProvider) {
    super(provider);
    
    // Utilisation des informations d'identification fournies par l'utilisateur
    this.ses = new AWS.SES({
      region: provider.region || 'us-east-1',
      credentials: {
        accessKeyId: provider.username || '',
        secretAccessKey: provider.password || ''
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const params = {
        Source: `${options.from.name} <${options.from.email}>`,
        Destination: {
          ToAddresses: options.to
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
      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [
            {
              to: options.to.map(email => ({ email })),
              subject: options.subject,
              dynamic_template_data: options.variables
            }
          ],
          from: {
            email: options.from.email,
            name: options.from.name
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
                Email: options.from.email,
                Name: options.from.name
              },
              To: options.to.map(email => ({ Email: email })),
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
      // Note: Dans un environnement réel, nous utiliserions nodemailer ou un autre service
      // pour envoyer des emails via SMTP, ce qui nécessiterait un backend.
      // Ici, nous simulons juste l'envoi.
      console.log('Envoi d\'email via SMTP personnalisé:', {
        host: this.provider.host,
        port: this.provider.port,
        username: this.provider.username,
        to: options.to,
        from: options.from,
        subject: options.subject
      });

      return {
        success: true,
        messageId: `custom-smtp-${Date.now()}`
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

// Service pour Office365
export class Office365Service extends SmtpService {
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Note: Dans un environnement réel, nous utiliserions Microsoft Graph API
      // Ici, nous simulons juste l'envoi.
      console.log('Envoi d\'email via Office365:', {
        username: this.provider.username,
        to: options.to,
        from: options.from,
        subject: options.subject
      });

      return {
        success: true,
        messageId: `office365-${Date.now()}`
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi d\'email via Office365:', error);
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