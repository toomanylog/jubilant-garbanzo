import React from 'react';
import { ArrowLeft, FileText, Shield, Lock, Eye, Bell, Database, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
          
          <div className="flex items-center mb-6">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Politique de Confidentialité
            </h1>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
            <span>Dernière mise à jour : 15 juin 2023</span>
            <span className="inline-block h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            <span>Version : 1.3</span>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="prose prose-blue dark:prose-invert max-w-none">
            <p className="lead text-lg text-gray-600 dark:text-gray-300">
              Chez North Eyes, nous accordons une grande importance à la protection de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations lorsque vous utilisez notre application.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              En utilisant notre service, vous consentez à la collecte et à l'utilisation de vos informations conformément à cette politique.
            </p>
          </div>
        </div>

        {/* Sections principales */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-blue-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Database className="h-6 w-6 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Informations que nous collectons</h2>
              </div>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Nous collectons plusieurs types d'informations à votre sujet :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Informations d'identification :</strong> nom, adresse email, mot de passe.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Informations de profil :</strong> nom de l'entreprise, secteur d'activité, préférences.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Données d'utilisation :</strong> informations sur la façon dont vous utilisez notre application, telles que les fonctionnalités utilisées, les pages visitées et le temps passé sur l'application.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Données techniques :</strong> adresse IP, type de navigateur, type d'appareil, système d'exploitation, données de localisation.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Contenu des campagnes :</strong> modèles d'emails, listes de destinataires, contenu des emails.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-purple-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 text-purple-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Comment nous utilisons vos informations</h2>
              </div>
              <div className="prose prose-purple dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Nous utilisons vos informations pour :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Fournir, maintenir et améliorer notre service
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Créer et gérer votre compte
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Traiter vos transactions
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Vous envoyer des informations techniques, administratives et promotionnelles
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Personnaliser votre expérience utilisateur
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Analyser l'utilisation de notre service pour améliorer nos offres
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Détecter, prévenir et résoudre les problèmes techniques et de sécurité
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Se conformer aux obligations légales
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-green-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <UserCheck className="h-6 w-6 text-green-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Partage de vos informations</h2>
              </div>
              <div className="prose prose-green dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Nous pouvons partager vos informations avec :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Fournisseurs de services :</strong> entreprises qui nous fournissent des services, comme l'hébergement, l'analyse de données, le traitement des paiements.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Partenaires commerciaux :</strong> uniquement avec votre consentement, pour vous offrir certains produits, services ou promotions.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Autorités légales :</strong> si nous y sommes contraints par la loi ou si nous pensons de bonne foi que cette divulgation est nécessaire pour protéger nos droits, votre sécurité ou celle d'autres personnes.
                    </span>
                  </li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  Nous ne vendons pas vos données personnelles à des tiers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-amber-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Lock className="h-6 w-6 text-amber-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Sécurité des données</h2>
              </div>
              <div className="prose prose-amber dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  La sécurité de vos données est importante pour nous. Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations contre tout accès non autorisé, altération, divulgation ou destruction.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  Cependant, aucune méthode de transmission sur Internet ou de stockage électronique n'est totalement sécurisée. Nous ne pouvons donc pas garantir une sécurité absolue.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-red-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-red-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Vos droits</h2>
              </div>
              <div className="prose prose-red dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Selon votre lieu de résidence, vous pouvez avoir certains droits concernant vos données personnelles, notamment :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Accéder à vos données personnelles
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Corriger des données inexactes
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Supprimer vos données
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Restreindre ou s'opposer au traitement de vos données
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Demander la portabilité de vos données
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Retirer votre consentement à tout moment
                    </span>
                  </li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  Pour exercer ces droits, veuillez nous contacter via les coordonnées fournies ci-dessous.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-indigo-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Bell className="h-6 w-6 text-indigo-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Modifications de cette politique</h2>
              </div>
              <div className="prose prose-indigo dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Nous pouvons mettre à jour notre politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique de confidentialité sur cette page et en vous envoyant un email.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  Nous vous encourageons à consulter régulièrement cette politique pour prendre connaissance des modifications.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Contact */}
        <div className="mt-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Des questions sur la confidentialité ?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à :
          </p>
          <a 
            href="mailto:privacy@northeyes.com" 
            className="text-primary hover:underline font-medium"
          >
            privacy@northeyes.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage; 