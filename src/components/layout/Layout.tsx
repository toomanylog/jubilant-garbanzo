import React, { useState, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  BarChart2,
  FileText, 
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Eye,
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

// Éléments du menu
const menuItems = [
  { 
    name: 'Tableau de bord', 
    path: '/dashboard', 
    icon: <LayoutDashboard className="h-5 w-5" /> 
  },
  { 
    name: 'Campagnes', 
    path: '/campaigns', 
    icon: <BarChart2 className="h-5 w-5" /> 
  },
  { 
    name: 'Templates', 
    path: '/templates', 
    icon: <FileText className="h-5 w-5" /> 
  },
  { 
    name: 'SMTP', 
    path: '/smtp-providers', 
    icon: <Mail className="h-5 w-5" /> 
  },
  { 
    name: 'Paramètres', 
    path: '/settings', 
    icon: <Settings className="h-5 w-5" /> 
  }
];

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'North Eyes', 
  description = 'Plateforme d\'envoi d\'emails professionnels' 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Gestion de l'ouverture/fermeture du menu mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Réduire/étendre le menu latéral sur desktop
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Gestion de la déconnexion
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

      {/* Sidebar pour mobile - s'affiche en overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-gray-800/50 dark:bg-gray-900/80 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={toggleSidebar}
      />

      {/* Sidebar pour mobile */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center" onClick={() => setSidebarOpen(false)}>
            <Eye className="h-7 w-7 text-primary" />
            <span className="ml-2.5 text-lg font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NORTH EYES
            </span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 overflow-y-auto">
          <div className="px-3 pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-3.5 py-2.5">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {currentUser?.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 px-3">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg group",
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {(location.pathname === item.path || location.pathname.startsWith(item.path + '/')) && (
                  <ChevronRight className="h-4 w-4 opacity-70" />
                )}
              </Link>
            ))}
          </nav>

          <div className="px-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar pour desktop */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden lg:block bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center">
            <Eye className="h-7 w-7 text-primary" />
            {!collapsed && (
              <span className="ml-2.5 text-lg font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NORTH EYES
              </span>
            )}
          </Link>
          <button
            onClick={toggleCollapse}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", collapsed ? "rotate-180" : "")} />
          </button>
        </div>

        <div className="py-4 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-3 py-2.5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-4 w-4" />
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUser?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1 px-3">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center py-2.5 text-sm font-medium rounded-lg group",
                  collapsed ? "justify-center px-2.5" : "px-3",
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                )}
              >
                <span className={collapsed ? "" : "mr-3"}>{item.icon}</span>
                {!collapsed && <span className="flex-1">{item.name}</span>}
                {!collapsed && (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) && (
                  <ChevronRight className="h-4 w-4 opacity-70" />
                )}
              </Link>
            ))}
          </nav>

          <div className={cn(
            "mt-6 pt-4 border-t border-gray-200 dark:border-gray-700",
            collapsed ? "px-2" : "px-3"
          )}>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
                collapsed ? "justify-center px-2.5" : "w-full px-3"
              )}
              title="Déconnexion"
            >
              <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Header pour mobile et contenu principal */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:border-none">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:hidden">
            <button
              onClick={toggleSidebar}
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-md dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            
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

        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 