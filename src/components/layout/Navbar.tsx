import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { LayoutDashboard, BarChart, Settings, Package, Mail, LogOut, Menu, X, Eye, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Ici, ajoutez la logique pour basculer entre les modes clairs et sombres
    document.documentElement.classList.toggle('dark');
  };

  const menuItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Campagnes', path: '/campaigns', icon: <BarChart className="w-5 h-5" /> },
    { name: 'Templates', path: '/templates', icon: <Package className="w-5 h-5" /> },
    { name: 'SMTP', path: '/smtp-providers', icon: <Mail className="w-5 h-5" /> },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center">
              <Eye className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NORTH EYES
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {isAuthenticated && menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center',
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Authentication */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/settings"
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      location.pathname === '/settings'
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                    )}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="group relative overflow-hidden rounded-md bg-white px-4 py-2 text-base font-semibold text-primary transition-all duration-300 ease-out hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                    >
                      <span className="relative z-10">Se connecter</span>
                      <span className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button 
                      size="sm"
                      className="relative inline-flex overflow-hidden rounded-md bg-primary px-4 py-2 text-base font-semibold text-white transition-all duration-300 ease-out hover:bg-primary/90 active:translate-y-[1px]"
                    >
                      <span className="relative z-10">S'inscrire</span>
                      <span className="absolute inset-0 transform translate-y-10 opacity-0 transition-all duration-300 ease-out bg-gradient-to-r from-primary/90 to-primary/70 hover:translate-y-0 hover:opacity-100"></span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleDarkMode}
              className="p-2 mr-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-1 p-3 pb-6">
            {isAuthenticated ? (
              menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center px-4 py-3 text-base font-medium rounded-md',
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                  )}
                  onClick={toggleMenu}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))
            ) : (
              <div className="flex flex-col space-y-3 px-4 py-2">
                <Link
                  to="/login"
                  className="flex justify-center py-3 text-base font-medium text-primary bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-700"
                  onClick={toggleMenu}
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="flex justify-center py-3 text-base font-medium text-white bg-primary rounded-md shadow-sm hover:bg-primary/90"
                  onClick={toggleMenu}
                >
                  S'inscrire
                </Link>
              </div>
            )}
            
            {isAuthenticated && (
              <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
                <Link
                  to="/settings"
                  className={cn(
                    'flex items-center px-4 py-3 text-base font-medium rounded-md',
                    location.pathname === '/settings'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                  )}
                  onClick={toggleMenu}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Paramètres
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="flex w-full items-center px-4 py-3 text-base font-medium text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 