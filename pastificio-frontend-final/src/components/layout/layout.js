import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  FileText, 
  Printer, 
  AlignJustify, 
  X, 
  LogOut, 
  Moon, 
  Sun,
  User,
  Receipt,
  BarChart4,
  Users // AGGIUNGI QUESTA ICONA
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fatturazioneOpen, setFatturazioneOpen] = useState(false);
  const [clientiOpen, setClientiOpen] = useState(false); // AGGIUNGI QUESTO STATO
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // AGGIORNA navigationItems
  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/ordini', label: 'Gestione Ordini', icon: <Package className="h-5 w-5" /> },
    { path: '/clienti', label: 'Clienti', icon: <Users className="h-5 w-5" /> }, // AGGIUNGI QUESTA LINEA
    { path: '/stampe', label: 'Stampe', icon: <Printer className="h-5 w-5" /> },
    { path: '/log-audit', label: 'Log e Audit', icon: <FileText className="h-5 w-5" /> },
    { path: '/configurazione', label: 'Configurazione', icon: <Settings className="h-5 w-5" /> },
  ];

  const fatturazioneItems = [
    { path: '/fatture', label: 'Gestione Fatture', icon: <Receipt className="h-5 w-5" /> },
    { path: '/fatture/nuova', label: 'Nuova Fattura', icon: <FileText className="h-5 w-5" /> },
    { path: '/fatture/dashboard', label: 'Dashboard Fatturazione', icon: <BarChart4 className="h-5 w-5" /> },
  ];

  const isInFatturazione = location.pathname.startsWith('/fatture');
  const isInClienti = location.pathname.startsWith('/clienti'); // AGGIUNGI QUESTA LINEA

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar per mobile (overlay) */}
      <div 
        className={`
          fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden 
          ${sidebarOpen ? 'block' : 'hidden'}
        `}
        onClick={closeSidebar}
      >
        <div 
          className="fixed inset-y-0 left-0 w-72 bg-background border-r"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-14 items-center px-4 border-b">
            <h2 className="text-lg font-semibold">Pastificio Gestionale</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto" 
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="py-4">
              <nav className="grid gap-1 px-2">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'}
                    `}
                    onClick={closeSidebar}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
                
                {/* Fatturazione Collapsible Menu Mobile */}
                <Collapsible 
                  open={fatturazioneOpen || isInFatturazione} 
                  onOpenChange={setFatturazioneOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <div className={`
                      flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm
                      ${isInFatturazione ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                      cursor-pointer
                    `}>
                      <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5" />
                        <span>Fatturazione</span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-4 w-4 transition-transform ${fatturazioneOpen || isInFatturazione ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-4 mt-1 grid gap-1">
                      {fatturazioneItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `
                            flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                            ${isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'}
                          `}
                          onClick={closeSidebar}
                        >
                          {item.icon}
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </nav>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Sidebar per desktop (fixed) */}
      <div className="hidden lg:block w-72 border-r">
        <div className="flex h-14 items-center px-4 border-b">
          <h2 className="text-lg font-semibold">Pastificio Gestionale</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="py-4">
            <nav className="grid gap-1 px-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'}
                  `}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
              
              {/* Fatturazione Collapsible Menu Desktop */}
              <Collapsible 
                open={fatturazioneOpen || isInFatturazione} 
                onOpenChange={setFatturazioneOpen}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <div className={`
                    flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm
                    ${isInFatturazione ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    cursor-pointer
                  `}>
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5" />
                      <span>Fatturazione</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 transition-transform ${fatturazioneOpen || isInFatturazione ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-4 mt-1 grid gap-1">
                    {fatturazioneItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                          flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                          ${isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'}
                        `}
                      >
                        {item.icon}
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </nav>
          </div>
        </ScrollArea>
      </div>

      {/* Contenuto principale */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <AlignJustify className="h-5 w-5" />
          </Button>
          
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Passa a tema chiaro' : 'Passa a tema scuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full" 
                  aria-label="Apri menu utente"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.username || 'Utente'} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.username || 'Utente'}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.ruolo || 'Operatore'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;