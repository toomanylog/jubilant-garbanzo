# Script PowerShell pour installer AWS CLI et déployer le template CloudFormation

# Fonction pour vérifier si une commande existe
function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        if (Get-Command $command) { return $true }
    } catch { return $false }
    finally { $ErrorActionPreference = $oldPreference }
}

# Vérifier si AWS CLI est déjà installé
if (-not (Test-CommandExists aws)) {
    Write-Host "Installation d'AWS CLI..." -ForegroundColor Yellow
    
    # Télécharger le programme d'installation AWS CLI
    $installerUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"
    
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
    
    # Installer AWS CLI
    Start-Process -FilePath msiexec.exe -Args "/i $installerPath /quiet /norestart" -Wait
    
    # Vérifier que l'installation a réussi
    if (Test-CommandExists aws) {
        Write-Host "AWS CLI a été installé avec succès!" -ForegroundColor Green
    } else {
        Write-Host "Impossible d'installer AWS CLI. Veuillez l'installer manuellement." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "AWS CLI est déjà installé." -ForegroundColor Green
}

# Configurer les identifiants AWS
Write-Host "Configuration des identifiants AWS..." -ForegroundColor Yellow

$awsAccessKey = Read-Host "Entrez votre AWS Access Key (AKIA...)"
$awsSecretKey = Read-Host "Entrez votre AWS Secret Key" -AsSecureString
$region = Read-Host "Entrez la région AWS (par défaut: us-east-1)" 

if ([string]::IsNullOrEmpty($region)) {
    $region = "us-east-1"
}

# Convertir le mot de passe sécurisé en texte brut
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($awsSecretKey)
$awsSecretKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Configurer AWS CLI
$env:AWS_ACCESS_KEY_ID = $awsAccessKey
$env:AWS_SECRET_ACCESS_KEY = $awsSecretKeyPlain
$env:AWS_DEFAULT_REGION = $region

# Vérifier les permissions
Write-Host "Vérification des permissions AWS..." -ForegroundColor Yellow
$permissions = & aws iam get-user
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la vérification des permissions. Veuillez vérifier vos identifiants." -ForegroundColor Red
    exit 1
}

# Créer la pile CloudFormation
$stackName = "NorthEyesDynamoDBTables"
$templateFile = "dynamodb-tables.yaml"

# Vérifier si le fichier de template existe
if (-not (Test-Path $templateFile)) {
    Write-Host "Le fichier de template $templateFile n'existe pas." -ForegroundColor Red
    exit 1
}

Write-Host "Déploiement de la pile CloudFormation '$stackName'..." -ForegroundColor Yellow
$deploymentOutput = & aws cloudformation deploy --stack-name $stackName --template-file $templateFile --capabilities CAPABILITY_IAM

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du déploiement de la pile CloudFormation:" -ForegroundColor Red
    Write-Host $deploymentOutput -ForegroundColor Red
    Write-Host "Les identifiants AWS utilisés doivent avoir les permissions nécessaires pour CloudFormation et DynamoDB." -ForegroundColor Red
    Write-Host "Vérifiez que votre utilisateur IAM possède les politiques suivantes:" -ForegroundColor Yellow
    Write-Host "- AmazonDynamoDBFullAccess" -ForegroundColor Yellow
    Write-Host "- AWSCloudFormationFullAccess" -ForegroundColor Yellow
    exit 1
}

Write-Host "Les tables DynamoDB ont été créées avec succès!" -ForegroundColor Green

# Afficher les détails des tables créées
Write-Host "Vérification des tables créées..." -ForegroundColor Yellow
$tables = & aws dynamodb list-tables

Write-Host "Tables DynamoDB disponibles:" -ForegroundColor Green
Write-Host $tables

Write-Host "Configuration terminée! Votre application devrait maintenant fonctionner correctement avec DynamoDB." -ForegroundColor Green 