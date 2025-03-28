import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-300">Gérez vos paramètres utilisateur et les préférences de l'application</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Paramètres généraux</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Cette page vous permet de gérer vos paramètres utilisateur et les préférences de l'application.
        </p>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
            Fonctionnalité en développement
          </h3>
          <p className="text-blue-700 dark:text-blue-400">
            Cette fonctionnalité est en cours de développement et sera disponible prochainement.
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Préférences d'affichage</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Personnalisez l'apparence et les fonctionnalités de votre interface.
        </p>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mode d'affichage des résultats</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choisissez comment les résultats sont affichés</p>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 rounded-full text-gray-800 dark:text-gray-300">
              Bientôt disponible
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 