import { Amplify } from 'aws-amplify';
import AWS from 'aws-sdk';

// Configuration des identifiants AWS à partir des variables d'environnement
// Ces identifiants sont utilisés uniquement pour accéder à DynamoDB et les services AWS du backend
const awsConfig = {
  region: process.env.REACT_APP_AWS_REGION || '',
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY || ''
  }
};

// Configuration d'AWS SDK pour DynamoDB
AWS.config.update(awsConfig);

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

export default awsConfig; 