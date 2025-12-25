import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  InstagramIcon, 
  PlusIcon, 
  HistoryIcon, 
  UserIcon,
  LogOutIcon,
  CreditCardIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { TRANSLATIONS, Language } from '../constants/translations';
import { AnimatedCreditCounter } from './AnimatedCreditCounter';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  viewMode?: 'create' | 'saved';
  setViewMode?: (mode: 'create' | 'saved') => void;
  handleNewProjectClick?: () => void;
  onLoginClick?: () => void;
}

const FlagBR = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 rounded-sm overflow-hidden shadow-sm" preserveAspectRatio="none">
    <rect width="24" height="24" fill="#009c3b" />
    <path d="M12 4L22 12L12 20L2 12L12 4Z" fill="#ffdf00" />
    <circle cx="12" cy="12" r="3.5" fill="#002776" />
    <path d="M9.5 13C9.5 13 10.5 11.5 14.5 11.5" stroke="white" strokeWidth="0.5" strokeLinecap="round" fill="none" />
  </svg>
);

const FlagUS = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 rounded-sm overflow-hidden shadow-sm" preserveAspectRatio="none">
    <rect width="24" height="24" fill="#bf0a30" />
    <path d="M0 0H24V2.2H0V0Z" fill="white" />
    <path d="M0 4.4H24V6.6H0V4.4Z" fill="white" />
    <path d="M0 8.8H24V11H0V8.8Z" fill="white" />
    <path d="M0 13.2H24V15.4H0V13.2Z" fill="white" />
    <path d="M0 17.6H24V19.8H0V17.6Z" fill="white" />
    <path d="M0 22H24V24H0V22Z" fill="white" />
    <rect width="10" height="12" fill="#002868" />
  </svg>
);

export default function Header({ 
  language, 
  setLanguage, 
  viewMode, 
  setViewMode,
  handleNewProjectClick,
  onLoginClick
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();
  const t = TRANSLATIONS[language];

  const handleLoginClick = () => {
      if (onLoginClick) {
          onLoginClick();
      } else {
          navigate('/login');
      }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getUserName = () => {
      if (!user) return '';
      const metaName = user.user_metadata?.full_name;
      if (metaName) return metaName.split(' ')[0]; // First name
      return user.email?.split('@')[0] || 'Usuário';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/50">
      <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo and Title */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20 group hover:scale-105 transition-transform duration-300">
            <InstagramIcon className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-black text-xl tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              {t.appTitle}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/80">
              {t.appSubtitle}
            </p>
          </div>
        </Link>

        {/* Center Navigation (Only if props are provided) */}
        {setViewMode && (
          <div className="hidden md:flex bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => handleNewProjectClick ? handleNewProjectClick() : setViewMode('create')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                viewMode === 'create' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusIcon className="w-4 h-4" />
              {t.createRef}
            </button>
            <button
              onClick={() => setViewMode('saved')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                viewMode === 'saved' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              {t.historyRef}
            </button>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Credits Badge */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
               <CreditCardIcon className="w-4 h-4" />
               <AnimatedCreditCounter 
                 value={credits} 
                 className="font-bold text-sm" 
               />
               <span className="text-xs opacity-70 hidden sm:inline">{t.credits}</span>
               <button className="ml-2 w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs hover:bg-purple-400 transition-colors">
                 +
               </button>
            </div>
          )}

          {/* Language Selector */}
          <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setLanguage('pt')}
              className={`p-1.5 rounded-md transition-all ${
                language === 'pt' ? 'bg-white/10 shadow-sm' : 'opacity-50 hover:opacity-100'
              }`}
              title="Português"
            >
              <FlagBR />
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`p-1.5 rounded-md transition-all ${
                language === 'en' ? 'bg-white/10 shadow-sm' : 'opacity-50 hover:opacity-100'
              }`}
              title="English"
            >
              <FlagUS />
            </button>
          </div>

          {/* User Profile / Logout */}
          {user ? (
             <div className="flex items-center gap-3">
                <Link to="/profile" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                    Olá, <span className="font-bold text-white">{getUserName()}</span>
                </Link>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={handleLogout}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  title={t.logout}
                >
                  <LogOutIcon className="w-4 h-4" />
                </button>
             </div>
          ) : (
            <button 
                onClick={handleLoginClick} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
            >
              <UserIcon className="w-4 h-4" />
              {t.login}
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
