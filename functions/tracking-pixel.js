// Fonction Netlify pour traiter les pixels de tracking d'emails
const AWS = require('aws-sdk');
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

// Pixel transparent 1x1 en base64
const TRANSPARENT_PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

exports.handler = async function(event, context) {
  try {
    // Log pour débogage
    console.log('Fonction tracking-pixel appelée');
    console.log('Paramètres:', event.queryStringParameters);
    
    // Récupérer les paramètres de l'URL
    const { p: pixelId, c: campaignId, e: recipientEmail } = event.queryStringParameters || {};
    
    if (!pixelId || !campaignId || !recipientEmail) {
      console.log('Paramètres manquants:', { pixelId, campaignId, recipientEmail });
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: TRANSPARENT_PIXEL,
        isBase64Encoded: true
      };
    }
    
    // Créer un ID pour l'événement
    const eventId = uuidv4();
    const timestamp = Date.now();
    
    // Enregistrer l'événement d'ouverture
    await dynamoDB.put({
      TableName: 'EmailEvents',
      Item: {
        id: eventId,
        timestamp,
        eventType: 'open',
        messageId: pixelId,
        campaignId,
        recipientEmail,
        metadata: {
          userAgent: event.headers['user-agent'],
          ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || '0.0.0.0',
          referrer: event.headers['referer'] || ''
        }
      }
    }).promise();
    
    console.log('Événement enregistré avec succès:', eventId);
    
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
        ':timestamp': timestamp
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    
    console.log('Statut tracking mis à jour avec succès:', trackingId);
    
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
      body: TRANSPARENT_PIXEL,
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
      body: TRANSPARENT_PIXEL,
      isBase64Encoded: true
    };
  }
}; 