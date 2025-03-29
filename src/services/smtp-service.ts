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
  private lastSendTime: number = 0;
  private sendCounts: {
    second: { count: number, timestamp: number },
    minute: { count: number, timestamp: number },
    hour: { count: number, timestamp: number },
    day: { count: number, timestamp: number },
    total: number
  };

  constructor(provider: SmtpProvider) {
    this.provider = provider;
    this.sendCounts = {
      second: { count: 0, timestamp: Date.now() },
      minute: { count: 0, timestamp: Date.now() },
      hour: { count: 0, timestamp: Date.now() },
      day: { count: 0, timestamp: Date.now() },
      total: 0
    };
  }

  // Vérification des limites de taux
  protected async checkRateLimits(): Promise<{ canSend: boolean, reason?: string }> {
    const now = Date.now();
    
    // Utiliser les nouvelles propriétés au lieu de rateLimits
    const perSecond = this.provider.sendingRatePerSecond;
    const perMinute = this.provider.sendingRatePerMinute;
    const perHour = this.provider.sendingRatePerHour;
    const perDay = this.provider.sendingRatePerDay;
    const dailyQuota = this.provider.dailyQuota;

    // Si aucune limite n'est définie, autoriser l'envoi
    if (!perSecond && !perMinute && !perHour && !perDay && !dailyQuota) {
      return { canSend: true };
    }

    // Réinitialiser les compteurs si nécessaire
    if (now - this.sendCounts.second.timestamp >= 1000) {
      this.sendCounts.second = { count: 0, timestamp: now };
    }
    if (now - this.sendCounts.minute.timestamp >= 60000) {
      this.sendCounts.minute = { count: 0, timestamp: now };
    }
    if (now - this.sendCounts.hour.timestamp >= 3600000) {
      this.sendCounts.hour = { count: 0, timestamp: now };
    }
    if (now - this.sendCounts.day.timestamp >= 86400000) {
      this.sendCounts.day = { count: 0, timestamp: now };
    }

    // Vérifier les limites
    if (perSecond && this.sendCounts.second.count >= perSecond) {
      return { canSend: false, reason: `Limite par seconde (${perSecond}) atteinte` };
    }
    if (perMinute && this.sendCounts.minute.count >= perMinute) {
      return { canSend: false, reason: `Limite par minute (${perMinute}) atteinte` };
    }
    if (perHour && this.sendCounts.hour.count >= perHour) {
      return { canSend: false, reason: `Limite par heure (${perHour}) atteinte` };
    }
    if (perDay && this.sendCounts.day.count >= perDay) {
      return { canSend: false, reason: `Limite par jour (${perDay}) atteinte` };
    }
    if (dailyQuota && this.sendCounts.total >= dailyQuota) {
      return { canSend: false, reason: `Quota journalier (${dailyQuota}) atteint` };
    }

    return { canSend: true };
  }

  // Mise à jour des compteurs après un envoi
  protected updateSendCounts(): void {
    this.sendCounts.second.count++;
    this.sendCounts.minute.count++;
    this.sendCounts.hour.count++;
    this.sendCounts.day.count++;
    this.sendCounts.total++;
    this.lastSendTime = Date.now();
  }

  // Détecte si le contenu est au format HTML
  protected isHtmlContent(content: string): boolean {
    // Vérifier si le contenu contient des balises HTML
    const htmlRegex = /<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>/i;
    return htmlRegex.test(content) || content.includes('<html') || content.includes('<body') || content.includes('<div') || content.includes('<p');
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
      // Ne pas définir d'endpoint personnalisé pour permettre à AWS SDK de choisir le bon endpoint basé sur la région
    });
    
    console.log(`⚠️ Configuration SES - Instance SES créée pour la région ${region}`);
  }

  // Obtient le prochain expéditeur selon la stratégie de rotation
  private getNextSender(options: EmailOptions): { name: string, email: string } {
    // Utiliser directement les informations de l'expéditeur depuis les options d'envoi
    if (typeof options.from === 'string') {
      const match = options.from.match(/(.*?)\s*<(.+?)>/);
      if (match) {
        return {
          name: match[1].trim(),
          email: match[2].trim()
        };
      }
      return {
        name: '',
        email: options.from
      };
    } else {
      return {
        name: options.from.name,
        email: options.from.email
      };
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Vérifier les limites de taux
      const rateCheck = await this.checkRateLimits();
      if (!rateCheck.canSend) {
        return {
          success: false,
          error: rateCheck.reason || 'Limite de taux atteinte'
        };
      }

      // Convertir 'to' en tableau si c'est une chaîne
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      
      // Préparer l'expéditeur
      const sender = this.getNextSender(options);
      const source = `${sender.name} <${sender.email}>`;
      
      console.log(`⚠️ Envoi d'email - De: ${source}`);

      // Détecter si le contenu est HTML
      const isHtml = this.isHtmlContent(options.html);
      console.log(`⚠️ Envoi d'email - Format détecté: ${isHtml ? 'HTML' : 'Texte'}`);

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
      
      // Mettre à jour les compteurs d'envoi
      this.updateSendCounts();
      
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