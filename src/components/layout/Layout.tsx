import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Menu,
  User,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Helmet } from 'react-helmet';

// Props du composant
interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'North Eyes', 
  description = 'Plateforme d\'envoi d\'emails professionnels' 
}) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  // Si l'utilisateur n'est pas authentifié, afficher uniquement le contenu
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet>
        <title>{`${title} | North Eyes`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Helmet>

      {/* Header pour mobile uniquement */}
      <header className="sticky top-0 z-10 lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full dark:text-gray-400 dark:hover:bg-gray-700">
              <Bell className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 pt-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 