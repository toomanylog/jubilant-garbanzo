import { Amplify } from 'aws-amplify';
import AWS from 'aws-sdk';

// Configuration des identifiants AWS à partir des variables d'environnement
// Ces identifiants sont utilisés uniquement pour accéder à DynamoDB et les services AWS du backend
const awsConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY || ''
  }
};

// Log de débogage pour vérifier les identifiants AWS
console.log('⚠️ Configuration AWS:');
console.log('- Région:', awsConfig.region);
console.log('- Access Key disponible:', !!awsConfig.credentials.accessKeyId);
console.log('- Secret Key disponible:', !!awsConfig.credentials.secretAccessKey);

// Configuration d'AWS SDK pour DynamoDB
AWS.config.update(awsConfig);

// S'assurer que tous les services AWS utilisent la même configuration
AWS.config.update({
  region: awsConfig.region,
  credentials: awsConfig.credentials
});

// Configuration d'Amplify avec cast temporaire pour éviter les erreurs de type
Amplify.configure({
  aws_project_region: awsConfig.region,
  Auth: {
    identityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID || '',
    region: awsConfig.region,
    userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID || '',
    userPoolWebClientId: process.env.REACT_APP_AWS_APP_CLIENT_ID || '',
    mandatorySignIn: true
  }
} as any);

// Export de DynamoDB pour une utilisation dans l'application
export const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Log de débogage pour vérifier la connectivité à DynamoDB
console.log('⚠️ DynamoDB client initialisé');

export default awsConfig; 