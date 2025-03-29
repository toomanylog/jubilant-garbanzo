// Fonction Netlify pour traiter les notifications de livraison d'emails
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
    console.log('Fonction delivery-webhook appelée');
    
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
    
    // Mettre à jour le statut de tracking
    await dynamoDB.update({
      TableName: 'EmailTracking',
      Key: { id: trackingItem.id },
      UpdateExpression: 'SET #status = :status, deliveredTimestamp = :timestamp, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'delivered',
        ':timestamp': Date.now(),
        ':updatedAt': Date.now()
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    
    console.log(`Statut de tracking mis à jour pour ${trackingItem.id}`);
    
    // Créer un événement de livraison
    const eventId = uuidv4();
    await dynamoDB.put({
      TableName: 'EmailEvents',
      Item: {
        id: eventId,
        timestamp: Date.now(),
        eventType: 'delivery',
        messageId: payload.messageId,
        campaignId: trackingItem.campaignId,
        recipientEmail: trackingItem.recipientEmail,
        metadata: {
          detail: payload.detail || '',
          userAgent: event.headers['user-agent'] || '',
          ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || '0.0.0.0'
        }
      }
    }).promise();
    
    console.log(`Événement de livraison créé avec l'ID: ${eventId}`);
    
    // Mettre à jour les statistiques de la campagne
    try {
      // Récupérer la campagne depuis DynamoDB
      const campaignResult = await dynamoDB.get({
        TableName: 'EmailCampaigns',
        Key: { campaignId: trackingItem.campaignId }
      }).promise();
      
      if (campaignResult.Item) {
        // Incrémenter le compteur de livraisons dans les statistiques
        const updatedStats = campaignResult.Item.stats || { 
          total: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complaints: 0 
        };
        
        updatedStats.delivered = (updatedStats.delivered || 0) + 1;
        
        // Recalculer les taux
        if (updatedStats.sent > 0) {
          updatedStats.deliveryRate = parseFloat(((updatedStats.delivered / updatedStats.sent) * 100).toFixed(2));
        }
        
        // Mettre à jour la campagne
        await dynamoDB.update({
          TableName: 'EmailCampaigns',
          Key: { campaignId: trackingItem.campaignId },
          UpdateExpression: 'SET stats = :stats, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':stats': updatedStats,
            ':updatedAt': new Date().toISOString()
          }
        }).promise();
        
        console.log(`Statistiques de la campagne ${trackingItem.campaignId} mises à jour`);
      }
    } catch (statsError) {
      console.error('Erreur lors de la mise à jour des statistiques:', statsError);
      // Continuer l'exécution même en cas d'erreur
    }
    
    // Réponse réussie
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Notification de livraison traitée avec succès'
      })
    };
  } catch (error) {
    console.error('Erreur lors du traitement de la notification de livraison:', error);
    
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