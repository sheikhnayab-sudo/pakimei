import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Search, PlusCircle, Info, Menu, X, Languages, LogOut, User, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const Header: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewReports, setHasNewReports] = useState(false);
  const location = useLocation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  useEffect(() => {
    // Check for new reports since last visit
    const checkNewReports = async () => {
      try {
        const lastVisited = localStorage.getItem('pakimei_last_visited_feed');
        if (!lastVisited) {
          setHasNewReports(true);
          return;
        }

        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const latestReport = snapshot.docs[0].data();
          const createdAt = latestReport.createdAt?.toDate()?.getTime() || 0;
          if (createdAt > parseInt(lastVisited)) {
            setHasNewReports(true);
          }
        }
      } catch (err) {
        console.error("Error checking new reports:", err);
      }
    };

    checkNewReports();
  }, [location.pathname]);

  const navItems = [
    { name: t('nav_home'), path: '/', icon: <Search size={18} /> },
    { name: t('nav_feed'), path: '/feed', icon: <LayoutGrid size={18} />, badge: hasNewReports },
    { name: t('nav_register'), path: '/register', icon: <PlusCircle size={18} /> },
    { name: t('nav_how_it_works'), path: '/how-it-works', icon: <Info size={18} /> },
  ];

  return (
    <header className="glass-header sticky top-0 z-50 w-full transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pak-red font-display text-2xl font-bold italic text-white shadow-lg shadow-pak-red/20 border border-white/20">
            P
          </div>
          <span className="font-display text-xl font-extrabold tracking-tighter text-white sm:text-2xl outline-glow">
            PAK<span className="text-pak-teal">IMEI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-2 text-sm font-medium transition-colors hover:text-pak-teal ${
                location.pathname === item.path ? 'text-pak-teal' : 'text-pak-muted'
              }`}
            >
              {item.name}
              {item.badge && (
                <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-pak-red border border-navy-900 animate-pulse shadow-sm shadow-pak-red/50" />
              )}
            </Link>
          ))}
          
          <div className="flex items-center gap-4 border-l border-white/10 pl-8">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2ec4b6] transition-all hover:bg-white/10 hover:border-pak-teal/50 active:scale-95"
            >
              <Languages size={14} />
              {language === 'en' ? 'اردو' : 'English'}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="h-8 w-8 rounded-full border border-pak-teal/50 shadow-lg shadow-pak-teal/20" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10">
                      <User size={14} className="text-pak-teal" />
                    </div>
                  )}
                  <div className="hidden lg:block">
                    <p className="text-xs font-bold text-white line-clamp-1 max-w-[100px]">{currentUser.displayName}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="rounded-full bg-white/5 p-2 text-pak-muted hover:bg-pak-red/20 hover:text-pak-red border border-white/5 transition-all"
                  title={t('auth_logout')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="btn-glass-primary flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-widest text-white"
              >
                {t('auth_login')}
              </button>
            )}
          </div>
        </nav>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          {currentUser && (
             <img src={currentUser.photoURL || ''} alt="" className="h-8 w-8 rounded-full border border-pak-teal/50" />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-pak-muted hover:text-pak-text"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden glass md:hidden border-x-0 border-b-0 rounded-none border-t border-white/10"
          >
            <div className="space-y-1 px-4 pb-6 pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-4 text-base font-medium relative ${
                    location.pathname === item.path
                      ? 'bg-pak-teal/10 text-pak-teal'
                      : 'text-pak-muted hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.name}
                  {item.badge && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-pak-red text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                      {t('feed_badge_new')}
                    </span>
                  )}
                </Link>
              ))}

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    toggleLanguage();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-xs font-bold text-pak-teal"
                >
                  <Languages size={14} />
                  {language === 'en' ? 'اردو' : 'EN'}
                </button>

                {currentUser ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-pak-red/10 py-3 text-xs font-bold text-pak-red"
                  >
                    <LogOut size={14} />
                    {t('auth_logout')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signInWithGoogle();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-pak-teal py-3 text-xs font-bold text-navy-900"
                  >
                    {t('auth_login')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
