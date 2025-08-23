// Layout/MainLayout.jsx

import React, { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Importazione icone
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BackupIcon from '@mui/icons-material/Backup';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, logout, isAuthenticated } = useAuth();

  // Reindirizza al login se non autenticato
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Genera il breadcrumb dal path corrente
  const generateBreadcrumb = () => {
    const pathnames = currentPath.split('/').filter(x => x);
    
    return (
      <div className="mb-4 flex items-center">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          return (
            <span key={name}>
              <span className="mx-2 text-gray-500">/</span>
              {isLast ? (
                <span className="font-medium">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
              ) : (
                <Link to={routeTo} className="text-blue-600 hover:underline">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  // Mappatura delle voci di menu con le relative icone e percorsi
  const menuItems = [
    { text: 'Dashboard', path: '/', icon: <HomeIcon /> },
    { text: 'Ordini', path: '/ordini', icon: <ShoppingCartIcon /> },
    { text: 'Magazzino', path: '/magazzino', icon: <InventoryIcon /> },
    { text: 'Report', path: '/report', icon: <AssessmentIcon /> },
    { text: 'Backup e Restore', path: '/backup', icon: <BackupIcon /> },
    { text: 'Notifiche', path: '/notifiche', icon: <NotificationsIcon /> },
    { text: 'Impostazioni', path: '/impostazioni', icon: <SettingsIcon /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Barra laterale */}
      <div className={`bg-white border-r ${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
          {isSidebarOpen && <h2 className="text-lg font-bold">Gestionale Pastificio</h2>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded hover:bg-blue-700">
            <MenuIcon />
          </button>
        </div>
        
        {/* Info utente */}
        {isSidebarOpen && (
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full">
                <PersonIcon className="text-blue-700" />
              </div>
              <div className="ml-3">
                <p className="font-medium">{user?.nome || 'Utente'}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.ruolo || 'Staff'}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="mt-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  to={item.path}
                  className={`flex items-center w-full p-3 ${
                    currentPath === item.path ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {isSidebarOpen && <span className="ml-3">{item.text}</span>}
                </Link>
              </li>
            ))}
            <li className="mt-auto border-t pt-2">
              <button
                onClick={logout}
                className="flex items-center w-full p-3 hover:bg-gray-100 text-red-500"
              >
                <LogoutIcon />
                {isSidebarOpen && <span className="ml-3">Logout</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
          {generateBreadcrumb()}
        </header>
        
        {/* Main content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;