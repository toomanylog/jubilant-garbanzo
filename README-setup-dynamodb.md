# Configuration des tables DynamoDB pour North Eyes

Ce document explique comment configurer les tables DynamoDB nécessaires pour faire fonctionner l'application North Eyes.

## Prérequis

- Un compte AWS avec accès à DynamoDB et CloudFormation
- PowerShell (Windows) ou Bash (Linux/macOS)
- AWS CLI (installé automatiquement par le script si nécessaire)

## Permissions AWS nécessaires

L'utilisateur AWS (celui dont vous utilisez les identifiants AKIA...) doit avoir les permissions suivantes :

1. **AmazonDynamoDBFullAccess** - Pour créer et gérer les tables DynamoDB
2. **AWSCloudFormationFullAccess** - Pour déployer le template CloudFormation

Si votre utilisateur n'a pas ces permissions, vous devez les ajouter via la console AWS IAM :
1. Connectez-vous à la console AWS
2. Allez dans IAM > Utilisateurs
3. Sélectionnez votre utilisateur
4. Cliquez sur "Ajouter des permissions"
5. Choisissez "Attacher directement les politiques"
6. Recherchez et sélectionnez les politiques mentionnées ci-dessus

## Méthode 1 : Utiliser le script automatique (recommandé)

### Sous Windows

1. Ouvrez PowerShell en tant qu'administrateur
2. Naviguez jusqu'au dossier contenant les fichiers `create-dynamodb-tables.ps1` et `dynamodb-tables.yaml`
3. Exécutez le script : 
   ```
   .\create-dynamodb-tables.ps1
   ```
4. Suivez les instructions à l'écran pour entrer vos identifiants AWS

Le script va :
- Installer AWS CLI si nécessaire
- Configurer vos identifiants AWS
- Vérifier vos permissions
- Déployer le template CloudFormation pour créer les tables DynamoDB
- Vérifier que les tables ont été créées correctement

## Méthode 2 : Déploiement manuel

Si vous préférez déployer manuellement le template CloudFormation :

1. Installez AWS CLI : [https://aws.amazon.com/cli/](https://aws.amazon.com/cli/)
2. Configurez AWS CLI avec vos identifiants :
   ```
   aws configure
   ```
3. Déployez le template CloudFormation :
   ```
   aws cloudformation deploy --stack-name NorthEyesDynamoDBTables --template-file dynamodb-tables.yaml --capabilities CAPABILITY_IAM
   ```
4. Vérifiez que les tables ont été créées :
   ```
   aws dynamodb list-tables
   ```

## Tables créées

Le template CloudFormation crée les tables suivantes :

1. **Users** - Pour stocker les informations utilisateurs
2. **SmtpProviders** - Pour stocker les fournisseurs SMTP (avec index GSI sur userId)
3. **EmailTemplates** - Pour stocker les modèles d'emails (avec index GSI sur userId)
4. **EmailCampaigns** - Pour stocker les campagnes d'emails (avec index GSI sur userId)

## Vérification

Pour vérifier que tout fonctionne correctement :

1. Redémarrez votre application North Eyes
2. Essayez d'ajouter un fournisseur SMTP
3. Vérifiez qu'il apparaît dans la liste des fournisseurs

Si vous rencontrez des problèmes, vérifiez les logs dans la console du navigateur pour des erreurs spécifiques.

## Nettoyage (optionnel)

Si vous souhaitez supprimer les tables créées :

```
aws cloudformation delete-stack --stack-name NorthEyesDynamoDBTables
```

## Support

Si vous rencontrez des problèmes lors de la configuration, vérifiez :
1. Que vos identifiants AWS sont corrects
2. Que votre utilisateur a les permissions nécessaires
3. Que vous êtes dans la même région que celle configurée dans votre application (us-east-1 par défaut) 