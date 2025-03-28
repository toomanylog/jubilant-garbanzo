import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Mail, Shield, Zap, BarChart2, RefreshCw, Check, Server, Clock, Lock, Code, Database, Eye } from 'lucide-react';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      if (animatedCount < 100) {
        setAnimatedCount(prev => Math.min(prev + 5, 100));
      } else {
        clearInterval(interval);
      }
    }, 40);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    { title: "Rotation d'éléments", description: "SMTP, Nom d'expéditeur, Sujet et Template HTML", icon: <RefreshCw className="h-6 w-6" /> },
    { title: "Variables dynamiques", description: "Personnalisation avancée du sujet et du contenu HTML", icon: <Code className="h-6 w-6" /> },
    { title: "Contrôle des limites", description: "Gestion précise de la fréquence d'envoi par minute/heure/jour", icon: <Clock className="h-6 w-6" /> },
    { title: "Protection automatique", description: "Auto-arrêt en cas de taux de bounce trop élevé", icon: <Shield className="h-6 w-6" /> },
    { title: "Compatibilité totale", description: "AWS SES, Sendgrid, Mailjet, Office365, Custom SMTP...", icon: <Server className="h-6 w-6" /> },
    { title: "Anonymat maximal", description: "Aucune conservation de données utilisateur, paiement en crypto", icon: <Lock className="h-6 w-6" /> }
  ];

  const tabContent = [
    {
      title: "Rotation d'expéditeurs",
      description: "Alternez automatiquement entre différents noms d'expéditeurs pour améliorer la délivrabilité",
      code: 'senderConfig: {\n  rotation: true,\n  senders: [\n    "support@domain.com",\n    "info@domain.com",\n    "contact@domain.com"\n  ]\n}'
    },
    {
      title: "Rotation de SMTP",
      description: "Utilisez plusieurs services SMTP en alternance pour optimiser vos taux de livraison",
      code: 'smtpConfig: {\n  rotation: true,\n  providers: [\n    { name: "AWS SES", limit: 500 },\n    { name: "Sendgrid", limit: 300 },\n    { name: "Custom SMTP", limit: 200 }\n  ]\n}'
    },
    {
      title: "Rotation de templates",
      description: "Alternez entre différents templates HTML pour tester et optimiser vos campagnes",
      code: 'templateConfig: {\n  rotation: true,\n  templates: [\n    { id: "template-a", weight: 60 },\n    { id: "template-b", weight: 40 }\n  ]\n}'
    }
  ];

  return (
    <div className="w-full text-gray-800">
      {/* Hero Section */}
      <section className={`py-16 bg-gradient-to-r from-purple-600 to-blue-500 text-white transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Gérez vos campagnes emails avec simplicité et efficacité</h1>
              <p className="text-lg md:text-xl mb-8">Service avancé d'envoi d'emails avec rotation de SMTP, expéditeurs et templates. Sécurité et anonymat garantis.</p>
              <div className="flex space-x-4">
                <Link to="/register" className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium flex items-center hover:bg-opacity-90 transition-all">
                  Commencer <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/help" className="border border-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-all">
                  Documentation
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <pre className="text-sm text-purple-100 overflow-x-auto">
                  <code>{`{
  "campaign": "newsletter_q1",
  "sender": {
    "rotation": true,
    "addresses": ["info@", "support@", "news@"]
  },
  "smtp": {
    "rotation": true,
    "providers": ["AWS SES", "Sendgrid", "Custom"]
  },
  "template": {
    "rotation": true,
    "variables": {
      "user": "{{name}}",
      "product": "{{product_name}}"
    }
  },
  "limits": {
    "perMinute": 60,
    "perHour": 500,
    "bounce_threshold": 2.5
  }
}`}</code>
                </pre>
              </div>
              <div className="absolute -top-4 -right-4 bg-purple-500 text-white p-2 rounded-lg text-sm font-medium">
                Configuration simplifiée
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats and Counter */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-4">
              <div className="bg-purple-100 p-4 rounded-lg">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <div className="text-3xl font-bold">{animatedCount}M+</div>
                <div className="text-gray-500">Emails délivrés</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold">{Math.floor(animatedCount * 0.965)}%</div>
                <div className="text-gray-500">Taux de délivrabilité</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-4">
              <div className="bg-green-100 p-4 rounded-lg">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold">{Math.floor(animatedCount / 5)}+</div>
                <div className="text-gray-500">Services SMTP supportés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fonctionnalités Avancées</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">North Eyes redéfinit les standards d'envoi d'emails avec des fonctionnalités innovantes et une sécurité renforcée.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-purple-200"
              >
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça fonctionne</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Simple à configurer, puissant à utiliser</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex justify-between mb-6">
                  {tabContent.map((tab, index) => (
                    <button 
                      key={index}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === index ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                      onClick={() => setActiveTab(index)}
                    >
                      {index === 0 ? "d'expéditeurs" : index === 1 ? "de SMTP" : "de templates"}
                    </button>
                  ))}
                </div>
                <h3 className="text-xl font-bold mb-2">{tabContent[activeTab].title}</h3>
                <p className="text-gray-600 mb-4">{tabContent[activeTab].description}</p>
                <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-sm">
                  <pre><code>{tabContent[activeTab].code}</code></pre>
                </div>
              </div>
            </div>
            <div className="md:w-5/12">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium">1</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Configuration des rotations</h3>
                    <p className="text-gray-600">Définissez vos paramètres de rotation pour les SMTP, expéditeurs et templates</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium">2</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Définition des limites</h3>
                    <p className="text-gray-600">Paramétrez les fréquences d'envoi et les seuils de sécurité</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium">3</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Lancement de la campagne</h3>
                    <p className="text-gray-600">Démarrez votre campagne et suivez les performances en temps réel</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium">4</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Analyse des résultats</h3>
                    <p className="text-gray-600">Visualisez les statistiques détaillées et optimisez vos futures campagnes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-purple-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi choisir North Eyes</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">Une solution conçue pour maximiser la délivrabilité tout en garantissant votre anonymat</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-purple-800 bg-opacity-50 p-8 rounded-xl border border-purple-700">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-purple-700 p-3 rounded-lg">
                  <BarChart2 className="h-6 w-6 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Performance optimale</h3>
                  <p className="opacity-90">Notre système de rotation intelligent maximise vos taux de délivrabilité en distribuant vos envois de manière optimale entre vos différents SMTP.</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Répartition intelligente de la charge</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Algorithmes adaptatifs selon les performances</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Contrôle fin des limites d'envoi</span>
                </li>
              </ul>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-8 rounded-xl border border-purple-700">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-purple-700 p-3 rounded-lg">
                  <Lock className="h-6 w-6 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Sécurité et anonymat</h3>
                  <p className="opacity-90">Votre confidentialité est notre priorité. Aucune donnée d'identification n'est conservée et les paiements sont acceptés uniquement en crypto-monnaies.</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Aucune conservation d'adresses IP</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Pas de logs d'activité</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Paiement 100% anonyme (Monero recommandé)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-500 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à révolutionner vos campagnes email ?</h2>
          <p className="text-xl mb-8 opacity-90">Rejoignez North Eyes aujourd'hui et découvrez la puissance d'un système d'envoi d'emails véritablement optimisé.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all">
              Créer un compte
            </Link>
            <Link to="/help" className="border border-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-all">
              Consulter la documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;