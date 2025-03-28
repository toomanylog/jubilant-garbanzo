import React from 'react';
import { ArrowLeft, Cookie, Clock, ShieldCheck, Search, Settings, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookiesPage: React.FC = () => {
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
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Politique de Cookies
            </h1>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
            <span>Dernière mise à jour : 15 juin 2023</span>
            <span className="inline-block h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            <span>Version : 1.0</span>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="prose prose-blue dark:prose-invert max-w-none">
            <p className="lead text-lg text-gray-600 dark:text-gray-300">
              North Eyes utilise des cookies et technologies similaires sur notre site web et notre application. Cette politique explique comment et pourquoi nous utilisons ces technologies, et les choix dont vous disposez concernant leur utilisation.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              En utilisant notre service, vous consentez à l'utilisation des cookies conformément à cette politique.
            </p>
          </div>
        </div>

        {/* Sections principales */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-blue-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Cookie className="h-6 w-6 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Qu'est-ce que les cookies ?</h2>
              </div>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Les cookies sont de petits fichiers texte placés sur votre appareil (ordinateur, tablette ou téléphone mobile) lorsque vous visitez un site web. Les cookies sont largement utilisés pour faire fonctionner les sites web, les rendre plus efficaces, ainsi que pour fournir des informations aux propriétaires du site.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  Les cookies permettent à un site web de reconnaître votre appareil et de mémoriser des informations sur votre visite, comme vos préférences linguistiques, les pages que vous avez consultées et les informations que vous avez saisies dans les formulaires.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-purple-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Search className="h-6 w-6 text-purple-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Comment nous utilisons les cookies</h2>
              </div>
              <div className="prose prose-purple dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Nous utilisons différents types de cookies pour les raisons suivantes :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Cookies essentiels :</strong> Nécessaires au fonctionnement de notre site. Ils vous permettent de naviguer sur le site et d'utiliser ses fonctionnalités, comme l'accès aux zones sécurisées.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Cookies analytiques/de performance :</strong> Nous permettent de reconnaître et de compter le nombre de visiteurs et de voir comment les visiteurs se déplacent sur notre site. Cela nous aide à améliorer le fonctionnement de notre site.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Cookies de fonctionnalité :</strong> Utilisés pour vous reconnaître lorsque vous revenez sur notre site. Ils nous permettent de personnaliser notre contenu pour vous, de vous saluer par votre nom et de mémoriser vos préférences.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Cookies de ciblage :</strong> Enregistrent votre visite sur notre site, les pages que vous avez visitées et les liens que vous avez suivis. Nous utilisons ces informations pour rendre notre site et les publicités qui y sont affichées plus pertinents pour vos intérêts.
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
                <Clock className="h-6 w-6 text-green-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Durée de conservation des cookies</h2>
              </div>
              <div className="prose prose-green dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Les cookies peuvent être classés en deux catégories selon leur durée de vie :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Cookies de session :</strong> Ces cookies sont temporaires et expirent lorsque vous fermez votre navigateur. Ils sont utilisés pour mémoriser vos actions pendant une session de navigation unique.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Cookies persistants :</strong> Ces cookies restent sur votre appareil pendant une période définie (par exemple, un jour, une semaine ou un an). Ils sont activés chaque fois que vous visitez le site web qui a créé ce cookie particulier.
                    </span>
                  </li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  La durée de conservation des cookies que nous utilisons varie en fonction de leur finalité. Les cookies essentiels sont généralement des cookies de session, tandis que les cookies analytiques et de ciblage sont généralement des cookies persistants.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-amber-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <ShieldCheck className="h-6 w-6 text-amber-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Cookies tiers</h2>
              </div>
              <div className="prose prose-amber dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  En plus de nos propres cookies, nous travaillons avec différentes parties tierces qui peuvent également définir des cookies sur votre appareil lorsque vous visitez notre site. Ces tiers comprennent :
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Services d'analyse :</strong> comme Google Analytics, qui nous aident à comprendre comment les visiteurs interagissent avec notre site.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Médias sociaux :</strong> comme Facebook et Twitter, qui peuvent utiliser des cookies pour suivre votre navigation et vous proposer des publicités ciblées.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Prestataires de services :</strong> qui nous aident à fournir certaines fonctionnalités du site, comme les outils de paiement ou de chat en direct.
                    </span>
                  </li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  Veuillez noter que nous n'avons pas d'accès ou de contrôle sur les cookies utilisés par ces services tiers. Nous vous recommandons de consulter leurs politiques de confidentialité respectives pour plus d'informations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-red-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <Settings className="h-6 w-6 text-red-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Gestion des cookies</h2>
              </div>
              <div className="prose prose-red dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Vous pouvez contrôler et gérer les cookies de plusieurs façons. Veuillez garder à l'esprit que la suppression ou le blocage des cookies peut affecter votre expérience utilisateur et certaines parties de notre site peuvent ne plus être entièrement accessibles.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  <strong>Paramètres du navigateur :</strong> La plupart des navigateurs vous permettent de contrôler les cookies via leurs paramètres. Ces paramètres se trouvent généralement dans le menu "Options" ou "Préférences" de votre navigateur.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  <strong>Outils de refus pour des cookies spécifiques :</strong> Certains services tiers offrent des mécanismes de désactivation spécifiques, comme Google Analytics.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  <strong>Bannière de cookies :</strong> Lorsque vous visitez notre site pour la première fois, une bannière de cookies vous informe de l'utilisation des cookies et vous permet de gérer vos préférences.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  Pour plus d'informations sur la façon de gérer les cookies, veuillez consulter le site <a href="https://www.allaboutcookies.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>, qui fournit des informations détaillées sur la gestion des cookies sur une grande variété de navigateurs.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-l-4 border-indigo-500 px-8 py-6">
              <div className="flex items-center mb-4">
                <RefreshCw className="h-6 w-6 text-indigo-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Mises à jour de notre politique de cookies</h2>
              </div>
              <div className="prose prose-indigo dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">
                  Nous pouvons mettre à jour cette politique de cookies de temps à autre afin de refléter, par exemple, les changements apportés aux cookies que nous utilisons ou pour d'autres raisons opérationnelles, légales ou réglementaires.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  Nous vous encourageons à consulter régulièrement cette politique pour rester informé de notre utilisation des cookies et des technologies connexes.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  La date en haut de cette politique indique quand elle a été mise à jour pour la dernière fois.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Contact */}
        <div className="mt-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Des questions sur les cookies ?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Si vous avez des questions concernant cette politique de cookies, veuillez nous contacter à :
          </p>
          <a 
            href="mailto:cookies@northeyes.com" 
            className="text-primary hover:underline font-medium"
          >
            cookies@northeyes.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage; 