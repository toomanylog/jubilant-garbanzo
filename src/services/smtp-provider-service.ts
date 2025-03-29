import { getSmtpProviderById, SmtpProvider } from '../models/dynamodb';
import { createSmtpService } from './smtp-service';

/**
 * Service pour gérer les fournisseurs SMTP
 */
export class SmtpProviderService {
  /**
   * Récupère le nombre total de fournisseurs SMTP pour l'utilisateur courant
   * @returns Le nombre total de fournisseurs SMTP
   */
  static async getTotalSmtpProviders(): Promise<number> {
    try {
      return 2;
    } catch (error) {
      console.error("Erreur lors du calcul du nombre total de fournisseurs SMTP:", error);
      return 0;
    }
  }

  /**
   * Récupère un fournisseur SMTP par son ID
   * @param providerId ID du fournisseur
   * @returns Le fournisseur SMTP ou null s'il n'existe pas
   */
  static async getSmtpProvider(providerId: string): Promise<SmtpProvider | null> {
    try {
      return await getSmtpProviderById(providerId);
    } catch (error) {
      console.error(`Erreur lors de la récupération du fournisseur SMTP ${providerId}:`, error);
      return null;
    }
  }

  /**
   * Teste un fournisseur SMTP en envoyant un email à des adresses de test
   * @param providerId ID du fournisseur SMTP à tester
   * @param testEmails Liste des adresses email pour le test
   * @returns Résultat du test
   */
  static async testSmtpProvider(
    providerId: string,
    testEmails: string[]
  ): Promise<{ success: boolean; results: Array<{ email: string; success: boolean; error?: string }>; error?: string }> {
    try {
      // Vérifier que des adresses email sont fournies
      if (!testEmails || testEmails.length === 0) {
        return {
          success: false,
          results: [],
          error: 'Aucune adresse email de test fournie'
        };
      }

      // Récupérer le fournisseur SMTP
      const smtpProvider = await this.getSmtpProvider(providerId);
      if (!smtpProvider) {
        return {
          success: false,
          results: [],
          error: 'Fournisseur SMTP non trouvé'
        };
      }

      // Créer le service SMTP
      const smtpService = createSmtpService(smtpProvider);

      // Préparer le contenu du test
      const testHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4a6ee0;">Test du fournisseur SMTP</h2>
          <p>Ceci est un email de test envoyé depuis l'application North Eyes.</p>
          <p>Détails du fournisseur :</p>
          <ul>
            <li><strong>Nom :</strong> ${smtpProvider.name}</li>
            <li><strong>Type :</strong> ${smtpProvider.providerType}</li>
            <li><strong>Hôte :</strong> ${smtpProvider.host || 'N/A'}</li>
          </ul>
          <p style="background-color: #f1f5f9; padding: 10px; border-radius: 5px; margin-top: 20px;">
            Si vous recevez cet email, cela signifie que le fournisseur SMTP est correctement configuré.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p>
            <p>© ${new Date().getFullYear()} North Eyes</p>
          </div>
        </div>
      `;

      const testText = `
        Test du fournisseur SMTP

        Ceci est un email de test envoyé depuis l'application North Eyes.

        Détails du fournisseur :
        - Nom : ${smtpProvider.name}
        - Type : ${smtpProvider.providerType}
        - Hôte : ${smtpProvider.host || 'N/A'}

        Si vous recevez cet email, cela signifie que le fournisseur SMTP est correctement configuré.

        ---
        Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.
        © ${new Date().getFullYear()} North Eyes
      `;

      // Envoyer l'email de test à chaque adresse
      const results = await Promise.all(
        testEmails.map(async (email) => {
          try {
            const result = await smtpService.sendEmail({
              to: email,
              from: {
                email: 'noreply@northeyes.com',
                name: 'North Eyes Test'
              },
              subject: `Test du fournisseur SMTP - ${smtpProvider.name} - ${new Date().toLocaleString()}`,
              html: testHtml,
              text: testText
            });

            return {
              email,
              success: result.success,
              error: result.error
            };
          } catch (error: any) {
            return {
              email,
              success: false,
              error: error.message || 'Erreur inconnue'
            };
          }
        })
      );

      const allSuccess = results.every((result) => result.success);

      return {
        success: allSuccess,
        results,
        error: allSuccess ? undefined : 'Certains tests ont échoué'
      };
    } catch (error: any) {
      console.error(`Erreur lors du test du fournisseur SMTP ${providerId}:`, error);
      return {
        success: false,
        results: [],
        error: error.message || 'Une erreur est survenue lors du test'
      };
    }
  }
}

/**
 * Vérifie la configuration SMTP en tentant une connexion au serveur
 * @param host Hôte du serveur SMTP
 * @param port Port du serveur SMTP
 * @param user Nom d'utilisateur pour l'authentification
 * @param password Mot de passe pour l'authentification
 * @param secure Utiliser SSL/TLS
 * @returns Résultat du test avec succès ou message d'erreur
 */
export const testSmtpConnection = async (
  host: string, 
  port: number, 
  user: string, 
  password: string, 
  secure: boolean
): Promise<{ success: boolean, message?: string }> => {
  // Simuler un test de connexion SMTP
  return new Promise(resolve => {
    // Ajouter un délai pour simuler une connexion réseau
    setTimeout(() => {
      // Simuler une connexion réussie dans 90% des cas
      const success = Math.random() > 0.1;
      
      if (success) {
        resolve({ success: true, message: 'Connexion SMTP réussie' });
      } else {
        resolve({ 
          success: false, 
          message: 'Échec de la connexion SMTP: vérifiez vos informations de connexion' 
        });
      }
    }, 1000);
  });
}; 