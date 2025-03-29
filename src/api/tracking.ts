import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configuration AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'eu-north-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Fonction qui gère les événements de pixel de tracking
 * @param event Événement API Gateway
 */
export async function handleTrackingPixel(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Récupérer les paramètres de l'URL
    const pixelId = event.pathParameters?.pixelId;
    const campaignId = event.queryStringParameters?.c;
    const recipientEmail = event.queryStringParameters?.e;
    
    if (!pixelId || !campaignId || !recipientEmail) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET'
        },
        body: 'Paramètres manquants'
      };
    }
    
    // Créer un ID pour l'événement
    const eventId = uuidv4();
    
    // Enregistrer l'événement d'ouverture
    await dynamoDB.put({
      TableName: 'EmailEvents',
      Item: {
        id: eventId,
        timestamp: Date.now(),
        eventType: 'open',
        messageId: pixelId, // Utiliser l'ID du pixel comme messageId temporaire
        campaignId,
        recipientEmail,
        metadata: {
          userAgent: event.headers['User-Agent'],
          ip: event.requestContext.identity?.sourceIp,
          referrer: event.headers['Referer'] || ''
        }
      }
    }).promise();
    
    // Mettre à jour le statut de tracking
    const trackingId = `${campaignId}:${recipientEmail}`;
    await dynamoDB.update({
      TableName: 'EmailTracking',
      Key: { id: trackingId },
      UpdateExpression: 'SET #status = :status, openedTimestamp = :timestamp',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'opened',
        ':timestamp': Date.now()
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    
    // Retourner un pixel transparent 1x1
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      },
      body: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Erreur lors du traitement du pixel de tracking:', error);
    
    // Même en cas d'erreur, retourner un pixel transparent
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      },
      body: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      isBase64Encoded: true
    };
  }
}

/**
 * Fonction qui gère les clics sur les liens trackés
 * @param event Événement API Gateway
 */
export async function handleLinkClick(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Récupérer les paramètres de l'URL
    const linkId = event.pathParameters?.linkId;
    const campaignId = event.queryStringParameters?.c;
    const recipientEmail = event.queryStringParameters?.e;
    const messageId = event.queryStringParameters?.m;
    const url = event.queryStringParameters?.u;
    
    if (!linkId || !campaignId || !recipientEmail || !url) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET'
        },
        body: 'Paramètres manquants'
      };
    }
    
    // Créer un ID pour l'événement
    const eventId = uuidv4();
    
    // Enregistrer l'événement de clic
    await dynamoDB.put({
      TableName: 'EmailEvents',
      Item: {
        id: eventId,
        timestamp: Date.now(),
        eventType: 'click',
        messageId: messageId || linkId, // Utiliser l'ID du message ou du lien
        campaignId,
        recipientEmail,
        metadata: {
          url,
          linkId,
          userAgent: event.headers['User-Agent'],
          ip: event.requestContext.identity?.sourceIp,
          referrer: event.headers['Referer'] || ''
        }
      }
    }).promise();
    
    // Mettre à jour le statut de tracking et ajouter le clic
    const trackingId = `${campaignId}:${recipientEmail}`;
    const now = Date.now();
    const newClick = { url, timestamp: now };
    
    await dynamoDB.update({
      TableName: 'EmailTracking',
      Key: { id: trackingId },
      UpdateExpression: 'SET #status = :status, clickedTimestamp = :timestamp, clickedLinks = list_append(if_not_exists(clickedLinks, :emptyList), :newClick)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'clicked',
        ':timestamp': now,
        ':emptyList': [],
        ':newClick': [newClick]
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    
    // Rediriger l'utilisateur vers l'URL d'origine
    return {
      statusCode: 302,
      headers: {
        'Location': url,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      },
      body: ''
    };
  } catch (error) {
    console.error('Erreur lors du traitement du clic sur le lien:', error);
    
    // En cas d'erreur, rediriger vers l'URL d'origine si disponible
    const url = event.queryStringParameters?.u;
    if (url) {
      return {
        statusCode: 302,
        headers: {
          'Location': url,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        },
        body: ''
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
      body: 'Une erreur est survenue'
    };
  }
}

/**
 * Fonction qui gère les notifications de bounces (webhooks)
 * @param event Événement API Gateway
 */
export async function handleBounceNotification(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Récupérer le corps de la requête
    const body = event.body ? JSON.parse(event.body) : null;
    
    if (!body || !body.messageId || !body.recipientEmail || !body.type) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST'
        },
        body: JSON.stringify({ message: 'Paramètres manquants' })
      };
    }
    
    // Rechercher l'email de tracking correspondant
    const result = await dynamoDB.query({
      TableName: 'EmailTracking',
      IndexName: 'MessageIdIndex',
      KeyConditionExpression: 'messageId = :messageId',
      ExpressionAttributeValues: {
        ':messageId': body.messageId
      },
      Limit: 1
    }).promise();
    
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Tracking non trouvé' })
      };
    }
    
    const trackingItem = result.Items[0];
    const eventId = uuidv4();
    
    // Enregistrer l'événement de bounce
    await dynamoDB.put({
      TableName: 'EmailEvents',
      Item: {
        id: eventId,
        timestamp: Date.now(),
        eventType: 'bounce',
        messageId: body.messageId,
        campaignId: trackingItem.campaignId,
        recipientEmail: body.recipientEmail,
        metadata: {
          type: body.type, // 'hard' ou 'soft'
          reason: body.reason || '',
          diagnostic: body.diagnostic || '',
          bounceSubType: body.subType || ''
        }
      }
    }).promise();
    
    // Mettre à jour le statut de tracking
    await dynamoDB.update({
      TableName: 'EmailTracking',
      Key: { id: trackingItem.id },
      UpdateExpression: 'SET #status = :status, bounceType = :bounceType, bounceReason = :bounceReason',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'bounced',
        ':bounceType': body.type,
        ':bounceReason': body.reason || ''
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Notification de bounce traitée avec succès' })
    };
  } catch (error) {
    console.error('Erreur lors du traitement de la notification de bounce:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Une erreur est survenue' })
    };
  }
}

/**
 * Fonction qui gère les webhooks AWS SES
 * @param event Événement API Gateway
 */
export async function handleAwsSesWebhook(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Vérifier l'en-tête de notification SNS
    if (event.headers['x-amz-sns-message-type']) {
      // C'est une notification SNS
      const body = event.body ? JSON.parse(event.body) : null;
      
      if (!body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Corps de la requête manquant' })
        };
      }
      
      // Gérer la confirmation d'abonnement SNS
      if (body.Type === 'SubscriptionConfirmation') {
        // Confirmer l'abonnement en appelant l'URL de confirmation
        const https = require('https');
        const url = body.SubscribeURL;
        
        // Appel HTTP pour confirmer l'abonnement
        await new Promise((resolve, reject) => {
          https.get(url, (res: any) => {
            res.on('data', () => {});
            res.on('end', resolve);
            res.on('error', reject);
          }).on('error', reject);
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Abonnement confirmé' })
        };
      }
      
      // Gérer les notifications
      if (body.Type === 'Notification') {
        const message = JSON.parse(body.Message);
        
        // Traiter en fonction du type de notification SES
        if (message.notificationType === 'Bounce') {
          const bounce = message.bounce;
          const recipients = bounce.bouncedRecipients;
          
          for (const recipient of recipients) {
            // Simuler une notification de bounce pour chaque destinataire
            await handleBounceNotification({
              ...event,
              body: JSON.stringify({
                messageId: message.mail.messageId,
                recipientEmail: recipient.emailAddress,
                type: bounce.bounceType.toLowerCase() === 'permanent' ? 'hard' : 'soft',
                reason: recipient.diagnosticCode || bounce.bounceSubType,
                diagnostic: recipient.diagnosticCode,
                subType: bounce.bounceSubType
              })
            } as APIGatewayProxyEvent);
          }
        }
        
        // Pour les autres types d'événements SES (Delivery, Complaint, etc.)
        // Ajouter le code de traitement ici selon les besoins
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Notification traitée' })
        };
      }
    }
    
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Type de webhook non pris en charge' })
    };
  } catch (error) {
    console.error('Erreur lors du traitement du webhook AWS SES:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Une erreur est survenue' })
    };
  }
} 