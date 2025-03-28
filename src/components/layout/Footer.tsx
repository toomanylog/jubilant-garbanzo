import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Heart, Sparkles, Zap } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-800 mt-auto py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Section 1 - À propos */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                North Eyes
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Solution moderne pour gérer vos campagnes emails avec simplicité et efficacité.
            </p>
            <div className="pt-2 flex space-x-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors duration-300" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors duration-300" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors duration-300" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Section 2 - Liens utiles */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Liens utiles
              </h3>
            </div>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-gray-600 dark:text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center">
                  <span className="bg-gradient-to-r from-transparent to-transparent hover:from-primary/10 hover:to-primary/5 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-no-repeat transition-all duration-500 py-1 px-2 -ml-2 rounded">
                    Aide & Documentation
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-gray-600 dark:text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center">
                  <span className="bg-gradient-to-r from-transparent to-transparent hover:from-primary/10 hover:to-primary/5 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-no-repeat transition-all duration-500 py-1 px-2 -ml-2 rounded">
                    Templates
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/campaigns" className="text-gray-600 dark:text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center">
                  <span className="bg-gradient-to-r from-transparent to-transparent hover:from-primary/10 hover:to-primary/5 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-no-repeat transition-all duration-500 py-1 px-2 -ml-2 rounded">
                    Campagnes
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/smtp-providers" className="text-gray-600 dark:text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center">
                  <span className="bg-gradient-to-r from-transparent to-transparent hover:from-primary/10 hover:to-primary/5 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-no-repeat transition-all duration-500 py-1 px-2 -ml-2 rounded">
                    Fournisseurs SMTP
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3 - Informations légales */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Informations légales
              </h3>
            </div>
            <ul className="space-y-3">
              <li>
                <Link to="/legal/terms" className="text-gray-600 dark:text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center">
                  <span className="bg-gradient-to-r from-transparent to-transparent hover:from-primary/10 hover:to-primary/5 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-no-repeat transition-all duration-500 py-1 px-2 -ml-2 rounded">
                    Conditions générales
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-gray-600 dark:text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center">
                  <span className="bg-gradient-to-r from-transparent to-transparent hover:from-primary/10 hover:to-primary/5 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-no-repeat transition-all duration-500 py-1 px-2 -ml-2 rounded">
                    Politique de confidentialité
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="text-gray-600 dark:text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center">
                  <span className="bg-gradient-to-r from-transparent to-transparent hover:from-primary/10 hover:to-primary/5 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-no-repeat transition-all duration-500 py-1 px-2 -ml-2 rounded">
                    Gestion des cookies
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            © {new Date().getFullYear()} North Eyes. Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 