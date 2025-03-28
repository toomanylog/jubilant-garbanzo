import React from 'react';
import { ArrowLeft, FileText, Shield, Users, Book, AlertTriangle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Conditions Générales d'Utilisation
            </h1>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
            <span>Dernière mise à jour : 15 juin 2023</span>
            <span className="inline-block h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            <span>Version : 2.1</span>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="prose prose-blue dark:prose-invert max-w-none">
            <p className="lead text-lg text-gray-600 dark:text-gray-300">
              Bienvenue sur North Eyes! Les présentes conditions générales décrivent les règles et règlements relatifs à l'utilisation de notre application.
            </p>
          </div>
        </div>

        {/* Sections principales */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-blue-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Book className="h-6 w-6 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Introduction et définitions</h2>
              </div>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Dans les présentes Conditions Générales d'Utilisation, les termes suivants s'entendent comme suit :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">1.1</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>"Application"</strong> désigne North Eyes, la plateforme d'envoi d'emails marketing et transactionnels accessible via le site web et les applications mobiles.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">1.2</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>"Nous"</strong>, <strong>"Notre"</strong> ou <strong>"Nos"</strong> fait référence à North Eyes et à ses propriétaires, dirigeants, administrateurs, employés, affiliés ou agents.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-2 mt-0.5 flex-shrink-0">1.3</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>"Vous"</strong>, <strong>"Votre"</strong> ou <strong>"Vos"</strong> fait référence à l'utilisateur de l'Application.
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
                <Users className="h-6 w-6 text-purple-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Utilisation du service</h2>
              </div>
              <div className="prose prose-purple dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  2.1. Vous acceptez d'utiliser l'Application conformément à toutes les lois et réglementations applicables, y compris les lois anti-spam et de protection des données.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  2.2. Il est strictement interdit d'utiliser l'Application pour envoyer des emails non sollicités (spam), des contenus illégaux, frauduleux, trompeurs, menaçants, injurieux, diffamatoires, obscènes ou préjudiciables.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  2.3. Vous devez obtenir le consentement explicite de vos destinataires avant de leur envoyer des emails, et respecter leur choix de se désabonner.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  2.4. Nous nous réservons le droit de suspendre ou de résilier votre accès à l'Application si nous estimons que vous utilisez le service en violation des présentes CGU ou de toute loi applicable.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-green-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-green-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Comptes utilisateurs</h2>
              </div>
              <div className="prose prose-green dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  3.1. Pour utiliser certaines fonctionnalités de l'Application, vous devez créer un compte utilisateur.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  3.2. Vous êtes responsable de maintenir la confidentialité de vos identifiants de compte et de toutes les activités qui se produisent sous votre compte.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  3.3. Vous acceptez de nous informer immédiatement de toute utilisation non autorisée de votre compte ou de toute autre violation de sécurité.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  3.4. Nous nous réservons le droit de désactiver tout compte utilisateur à notre seule discrétion, sans préavis, si nous estimons que vous avez enfreint les présentes CGU.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-amber-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Book className="h-6 w-6 text-amber-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Propriété intellectuelle</h2>
              </div>
              <div className="prose prose-amber dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  4.1. L'Application et son contenu original, fonctionnalités et fonctionnalités sont et resteront la propriété exclusive de notre société et sont protégés par les lois sur le droit d'auteur, les marques et autres lois sur la propriété intellectuelle.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  4.2. Nos marques de commerce et éléments d'interface ne peuvent pas être utilisés sans notre autorisation écrite préalable.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  4.3. Vous conservez tous les droits sur le contenu que vous soumettez, publiez ou affichez sur ou via l'Application.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-red-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Limitation de responsabilité</h2>
              </div>
              <div className="prose prose-red dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  5.1. L'Application est fournie "telle quelle" et "selon disponibilité" sans garantie d'aucune sorte, expresse ou implicite.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  5.2. Nous ne garantissons pas que l'Application sera ininterrompue, opportune, sécurisée ou sans erreur.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  5.3. En aucun cas, nous ne serons responsables de tout dommage direct, indirect, accidentel, spécial ou consécutif résultant de l'utilisation ou de l'impossibilité d'utiliser l'Application.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  5.4. Vous acceptez de nous indemniser et de nous tenir à l'écart de toute réclamation, perte, responsabilité, dépense ou dommage résultant de votre violation des présentes CGU ou de votre utilisation de l'Application.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-indigo-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <HelpCircle className="h-6 w-6 text-indigo-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Modifications des conditions</h2>
              </div>
              <div className="prose prose-indigo dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  6.1. Nous nous réservons le droit de modifier ou de remplacer ces CGU à tout moment.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  6.2. Les modifications prendront effet dès leur publication sur l'Application.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  6.3. Il est de votre responsabilité de consulter régulièrement ces CGU pour prendre connaissance des modifications éventuelles.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  6.4. Votre utilisation continue de l'Application après la publication des CGU modifiées constitue votre acceptation de ces modifications.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Contact */}
        <div className="mt-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Besoin de plus d'informations ?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Si vous avez des questions concernant ces Conditions Générales d'Utilisation, veuillez nous contacter à :
          </p>
          <a 
            href="mailto:legal@northeyes.com" 
            className="text-primary hover:underline font-medium"
          >
            legal@northeyes.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default TermsPage; 