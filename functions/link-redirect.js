// Fonction Netlify pour traiter les redirections de liens trackés
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

exports.handler = async function(event, context) {
  try {
    // Log pour débogage
    console.log('Fonction link-redirect appelée');
    console.log('Paramètres:', event.queryStringParameters);
    
    // Récupérer les paramètres de l'URL
    const { l: linkId, c: campaignId, e: recipientEmail, m: messageId, u: url } = event.queryStringParameters || {};
    
    if (!linkId || !campaignId || !recipientEmail || !url) {
      console.log('Paramètres manquants:', { linkId, campaignId, recipientEmail, url });
      // Si l'URL est disponible, redirigez quand même vers elle
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
        statusCode: 400,
        body: 'Paramètres manquants'
      };
    }
    
    // Créer un ID pour l'événement
    const eventId = uuidv4();
    const timestamp = Date.now();
    
    // Enregistrer l'événement de clic
    await dynamoDB.put({
      TableName: 'EmailEvents',
      Item: {
        id: eventId,
        timestamp,
        eventType: 'click',
        messageId: messageId || linkId,
        campaignId,
        recipientEmail,
        metadata: {
          url,
          linkId,
          userAgent: event.headers['user-agent'],
          ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || '0.0.0.0',
          referrer: event.headers['referer'] || ''
        }
      }
    }).promise();
    
    console.log('Événement de clic enregistré avec succès:', eventId);
    
    // Mettre à jour le statut de tracking et ajouter le clic
    const trackingId = `${campaignId}:${recipientEmail}`;
    const newClick = { url, timestamp };
    
    try {
      await dynamoDB.update({
        TableName: 'EmailTracking',
        Key: { id: trackingId },
        UpdateExpression: 'SET #status = :status, clickedTimestamp = if_not_exists(clickedTimestamp, :timestamp), clickedLinks = list_append(if_not_exists(clickedLinks, :emptyList), :newClick)',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'clicked',
          ':timestamp': timestamp,
          ':emptyList': [],
          ':newClick': [newClick]
        },
        ReturnValues: 'UPDATED_NEW'
      }).promise();
      
      console.log('Statut tracking mis à jour avec succès:', trackingId);
    } catch (dbError) {
      console.error('Erreur lors de la mise à jour du tracking, continuons quand même:', dbError);
    }
    
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
    console.error('Erreur lors du traitement de la redirection:', error);
    
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
      body: 'Une erreur est survenue'
    };
  }
}; 