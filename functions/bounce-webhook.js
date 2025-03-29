// Fonction Netlify pour traiter les notifications de bounce
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
    // Vérifier si le corps de la requête est présent
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Corps de la requête manquant' })
      };
    }
    
    // Log pour débogage
    console.log('Fonction bounce-webhook appelée');
    
    // Parser le corps de la requête
    const payload = JSON.parse(event.body);
    console.log('Payload reçu:', payload);
    
    // Validation des données minimales requises
    if (!payload.messageId || !payload.recipientEmail) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'messageId et recipientEmail requis' })
      };
    }
    
    // Rechercher l'item de tracking par messageId
    const result = await dynamoDB.query({
      TableName: 'EmailTracking',
      IndexName: 'MessageIdIndex',
      KeyConditionExpression: 'messageId = :messageId',
      ExpressionAttributeValues: {
        ':messageId': payload.messageId
      },
      Limit: 1
    }).promise();
    
    if (!result.Items || result.Items.length === 0) {
      console.log(`Aucun tracking trouvé pour le messageId: ${payload.messageId}`);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Tracking non trouvé' })
      };
    }
    
    const trackingItem = result.Items[0];
    console.log('Tracking trouvé:', trackingItem);
    
    // Déterminer le type de bounce
    const bounceType = payload.type === 'hard' ? 'hard' : 'soft';
    
    // Mettre à jour le statut de tracking
    await dynamoDB.update({
      TableName: 'EmailTracking',
      Key: { id: trackingItem.id },
      UpdateExpression: 'SET #status = :status, bounceType = :bounceType, bounceReason = :bounceReason, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'bounced',
        ':bounceType': bounceType,
        ':bounceReason': payload.reason || 'Raison inconnue',
        ':updatedAt': Date.now()
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    
    console.log(`Statut de tracking mis à jour pour ${trackingItem.id}`);
    
    // Créer un événement de bounce
    const eventId = uuidv4();
    await dynamoDB.put({
      TableName: 'EmailEvents',
      Item: {
        id: eventId,
        timestamp: Date.now(),
        eventType: 'bounce',
        messageId: payload.messageId,
        campaignId: trackingItem.campaignId,
        recipientEmail: trackingItem.recipientEmail,
        metadata: {
          bounceType,
          reason: payload.reason || 'Raison inconnue'
        }
      }
    }).promise();
    
    console.log(`Événement de bounce créé avec l'ID: ${eventId}`);
    
    // Réponse réussie
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Notification de bounce traitée avec succès'
      })
    };
  } catch (error) {
    console.error('Erreur lors du traitement de la notification de bounce:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Erreur lors du traitement de la notification',
        message: error.message
      })
    };
  }
}; 