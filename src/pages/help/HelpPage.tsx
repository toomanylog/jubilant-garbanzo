import React, { useState } from 'react';
import { 
  HelpCircle, 
  Book, 
  Mail, 
  ChevronDown, 
  Send, 
  FileText, 
  Settings, 
  Users, 
  Search, 
  CheckCircle 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

// Définition des types pour les panels d'accordéon
interface FaqItem {
  question: string;
  answer: string;
}

const HelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Gestion des FAQs
  const faqs: FaqItem[] = [
    {
      question: "Comment créer une campagne email ?",
      answer: "Pour créer une campagne email, connectez-vous à votre compte, accédez à la section 'Campagnes' et cliquez sur le bouton 'Nouvelle campagne'. Suivez ensuite les étapes pour configurer votre campagne, sélectionner un modèle, définir vos destinataires et planifier l'envoi."
    },
    {
      question: "Comment ajouter un fournisseur SMTP ?",
      answer: "Pour ajouter un fournisseur SMTP, allez dans 'Paramètres' > 'Fournisseurs SMTP' et cliquez sur 'Ajouter un fournisseur'. Remplissez les informations requises (nom, hôte, port, identifiants) et enregistrez. Une fois ajouté, vous pourrez sélectionner ce fournisseur lors de la création de vos campagnes."
    },
    {
      question: "Comment créer un modèle d'email ?",
      answer: "Pour créer un modèle d'email, accédez à la section 'Modèles' et cliquez sur 'Nouveau modèle'. Vous pouvez créer un modèle à partir de zéro ou importer un fichier HTML existant. Utilisez notre éditeur visuel pour personnaliser votre modèle avec du contenu dynamique et des images."
    },
    {
      question: "Comment voir les statistiques de mes campagnes ?",
      answer: "Les statistiques de vos campagnes sont disponibles dans la section 'Campagnes'. Cliquez sur une campagne spécifique puis sur l'onglet 'Statistiques'. Vous y trouverez des informations sur les taux d'ouverture, de clic, de rebond et de désinscription."
    },
    {
      question: "Comment gérer mes listes de destinataires ?",
      answer: "Pour gérer vos listes de destinataires, accédez à la section 'Listes'. Vous pouvez créer de nouvelles listes, importer des contacts depuis un fichier CSV, ajouter ou supprimer des contacts individuellement, et segmenter vos listes en fonction de critères spécifiques."
    },
    {
      question: "Comment prévisualiser un email avant envoi ?",
      answer: "Lors de la création ou de la modification d'une campagne, cliquez sur le bouton 'Prévisualiser' pour voir comment votre email s'affichera pour vos destinataires. Vous pouvez également vous envoyer un email test en cliquant sur 'Envoyer un test' et en saisissant votre adresse email."
    }
  ];

  // Filtrer les FAQs basé sur la recherche
  const filteredFaqs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  // Gestion du formulaire de contact
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler l'envoi
    console.log('Formulaire soumis:', contactForm);
    alert('Votre message a été envoyé. Nous vous répondrons dans les plus brefs délais.');
    // Réinitialiser le formulaire
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  // Gestion de l'accordéon
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Centre d'aide
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Trouvez des réponses à vos questions et apprenez à utiliser notre plateforme
          </p>
          
          {/* Zone de recherche */}
          <div className="mt-8 max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans l'aide..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab(0)}
              className={cn(
                "inline-flex items-center px-4 py-2 text-sm font-medium -mb-px transition-colors duration-200",
                activeTab === 0
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <HelpCircle className="w-5 h-5 mr-2" />
              <span>FAQ</span>
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={cn(
                "inline-flex items-center px-4 py-2 text-sm font-medium -mb-px transition-colors duration-200",
                activeTab === 1
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <Book className="w-5 h-5 mr-2" />
              <span>Guide d'utilisation</span>
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={cn(
                "inline-flex items-center px-4 py-2 text-sm font-medium -mb-px transition-colors duration-200",
                activeTab === 2
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <Mail className="w-5 h-5 mr-2" />
              <span>Nous contacter</span>
            </button>
          </div>
        </div>
        
        {/* Contenu des tabs */}
        <div className="mt-6">
          {/* Tab FAQ */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Questions fréquemment posées
              </h2>
              
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                    <HelpCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun résultat trouvé</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Essayez avec d'autres termes ou consultez notre guide d'utilisation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full px-4 py-4 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                        <ChevronDown 
                          className={cn(
                            "w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300",
                            expandedFaq === index ? "rotate-180" : ""
                          )} 
                        />
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tab Guide d'utilisation */}
          {activeTab === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Guide d'utilisation
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Carte Campagnes */}
                <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <div className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                        <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                          Gestion des campagnes
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Apprenez à créer, programmer et suivre vos campagnes d'emailing
                        </p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Création d'une nouvelle campagne</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Programmation d'envoi</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Analyse des statistiques</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">A/B testing pour optimiser vos emails</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Carte Templates */}
                <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <div className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
                        <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                          Création de modèles
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Découvrez comment créer des modèles d'emails personnalisés
                        </p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Utilisation de l'éditeur visuel</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Insertion de contenu dynamique</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Gestion des images et pièces jointes</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Tests de compatibilité multi-appareils</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Carte Configuration SMTP */}
                <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <div className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-4">
                        <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                          Configuration SMTP
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Apprenez à configurer vos fournisseurs SMTP
                        </p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Ajout d'un nouveau fournisseur SMTP</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Configuration des paramètres de sécurité</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Tests de connexion</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Rotation des fournisseurs pour l'envoi en masse</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Carte Gestion des contacts */}
                <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
                  <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  <div className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-4">
                        <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                          Gestion des contacts
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Découvrez comment gérer vos listes de contacts
                        </p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Importation de contacts depuis CSV</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Création de segments ciblés</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Gestion des désabonnements</span>
                      </li>
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">Nettoyage et validation des listes</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Vous avez besoin d'une aide personnalisée ?
                </p>
                <Button
                  onClick={() => setActiveTab(2)}
                  variant="gradient"
                  className="inline-flex items-center"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Contactez notre équipe</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* Tab Contact */}
          {activeTab === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Nous contacter
              </h2>
              
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Formulaire de contact */}
                  <div className="p-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Envoyez-nous un message
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Notre équipe vous répondra dans les plus brefs délais.
                    </p>
                    
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Votre nom
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={contactForm.name}
                          onChange={handleContactChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Adresse email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={contactForm.email}
                          onChange={handleContactChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          placeholder="john@exemple.com"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sujet
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          placeholder="Demande d'assistance"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={contactForm.message}
                          onChange={handleContactChange}
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          placeholder="Décrivez votre problème ou votre question..."
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        variant="gradient"
                        className="w-full justify-center"
                      >
                        Envoyer le message
                      </Button>
                    </form>
                  </div>
                  
                  {/* Informations de contact */}
                  <div className="bg-gradient-to-br from-primary/90 to-secondary/90 text-white p-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-4">Nos coordonnées</h3>
                      <p className="mb-8">
                        Notre équipe d'assistance est disponible pour vous aider et répondre à toutes vos questions.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <Mail className="w-5 h-5 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold">Email</p>
                            <a href="mailto:support@northeyes.com" className="text-white/90 hover:text-white">
                              support@northeyes.com
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-8">
                      <h4 className="text-lg font-semibold mb-3">Horaires d'assistance</h4>
                      <p className="text-sm text-white/90">
                        Du lundi au vendredi de 9h à 18h<br />
                        Fermé le week-end et les jours fériés
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;