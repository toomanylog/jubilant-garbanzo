// Fonction Netlify pour traiter les webhooks AWS SES (SNS)
const AWS = require('aws-sdk');
const axios = require('axios');
const https = require('https');
const { v4: uuidv4 } = require('uuid');

// Configuration AWS
const region = process.env.AWS_REGION || 'eu-north-1';
const accessKeyId = process.env.AWS_ACCESS_KEY || '';
const secretAccessKey = process.env.AWS_SECRET_KEY || '';

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

// Helper pour extraire l'information du message
function parseSnsMessage(event) {
  try {
    // Vérifier les en-têtes de notification SNS
    const isSnsMessage = event.headers && (
      event.headers['x-amz-sns-message-type'] || 
      event.headers['X-Amz-Sns-Message-Type']
    );
    
    if (!isSnsMessage) return null;
    
    // Parser le corps de la requête
    const body = event.body ? JSON.parse(event.body) : null;
    if (!body) return null;
    
    // Vérifier le type de message SNS
    if (body.Type === 'SubscriptionConfirmation') {
      return { type: 'subscription', subscribeUrl: body.SubscribeURL };
    }
    
    if (body.Type === 'Notification') {
      // Parser le message SES à l'intérieur de la notification SNS
      const message = JSON.parse(body.Message);
      return { type: 'notification', message };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors du parsing du message SNS:', error);
    return null;
  }
}

// Fonction pour confirmer l'abonnement SNS
async function confirmSubscription(subscribeUrl) {
  return new Promise((resolve, reject) => {
    https.get(subscribeUrl, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        console.log('Abonnement confirmé:', data);
        resolve(true);
      });
    }).on('error', (err) => {
      console.error('Erreur lors de la confirmation de l\'abonnement:', err);
      reject(err);
    });
  });
}

// Transférer une notification à un autre webhook
async function forwardNotification(url, payload) {
  try {
    console.log(`Transfert de la notification vers ${url}`, payload);
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors du transfert vers ${url}:`, error);
    throw error;
  }
}

// Handler principal
exports.handler = async function(event, context) {
  console.log('Fonction aws-ses-webhook appelée');
  console.log('Headers:', event.headers);
  
  try {
    // Extraire les informations du message SNS
    const snsData = parseSnsMessage(event);
    
    if (!snsData) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Format de message non reconnu' })
      };
    }
    
    // Gérer la confirmation d'abonnement
    if (snsData.type === 'subscription') {
      try {
        await confirmSubscription(snsData.subscribeUrl);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Abonnement confirmé avec succès' 
          })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Erreur lors de la confirmation de l\'abonnement',
            message: error.message
          })
        };
      }
    }
    
    // Gérer les notifications
    if (snsData.type === 'notification') {
      const message = snsData.message;
      
      // Base URL pour les webhooks
      const baseUrl = process.env.URL || 'https://your-site.netlify.app';
      
      // Traiter en fonction du type de notification
      if (message.notificationType === 'Bounce') {
        // Traiter chaque destinataire ayant eu un bounce
        const bounce = message.bounce;
        const recipients = bounce.bouncedRecipients;
        
        for (const recipient of recipients) {
          const payload = {
            messageId: message.mail.messageId,
            recipientEmail: recipient.emailAddress,
            type: bounce.bounceType.toLowerCase() === 'permanent' ? 'hard' : 'soft',
            reason: recipient.diagnosticCode || bounce.bounceSubType,
            diagnostic: recipient.diagnosticCode,
            subType: bounce.bounceSubType
          };
          
          await forwardNotification(`${baseUrl}/api/webhook/bounce`, payload);
        }
      } 
      else if (message.notificationType === 'Delivery') {
        // Traiter chaque destinataire pour lequel l'email a été livré
        const delivery = message.delivery;
        const recipients = message.mail.destination;
        
        for (const recipientEmail of recipients) {
          const payload = {
            messageId: message.mail.messageId,
            recipientEmail,
            timestamp: delivery.timestamp,
            smtpResponse: delivery.smtpResponse,
            reportingMTA: delivery.reportingMTA
          };
          
          await forwardNotification(`${baseUrl}/api/webhook/delivery`, payload);
        }
      }
      else if (message.notificationType === 'Complaint') {
        // Traiter les plaintes (marquage comme spam, etc.)
        const complaint = message.complaint;
        const recipients = complaint.complainedRecipients;
        
        for (const recipient of recipients) {
          const payload = {
            messageId: message.mail.messageId,
            recipientEmail: recipient.emailAddress,
            timestamp: complaint.timestamp,
            feedbackType: complaint.complaintFeedbackType
          };
          
          // Si vous avez un webhook spécifique pour les plaintes
          // await forwardNotification(`${baseUrl}/api/webhook/complaint`, payload);
          
          // Sinon, utiliser le webhook de bounce
          await forwardNotification(`${baseUrl}/api/webhook/bounce`, {
            ...payload,
            type: 'complaint',
            reason: complaint.complaintFeedbackType || 'spam'
          });
        }
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: true, 
          message: `Notification ${message.notificationType} traitée avec succès` 
        })
      };
    }
    
    // Si on arrive ici, c'est un type de message non pris en charge
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Type de message non pris en charge' })
    };
    
  } catch (error) {
    console.error('Erreur lors du traitement du webhook AWS SES:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Erreur lors du traitement du webhook',
        message: error.message
      })
    };
  }
}; 