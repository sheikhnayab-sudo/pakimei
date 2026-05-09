import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-white/10 py-16 px-4 text-center glass rounded-t-3xl border-b-0 border-x-0 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 text-sm font-bold uppercase tracking-widest text-white/40">
          <Link to="/privacy" className="hover:text-pak-teal transition-all">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-pak-teal transition-all">Terms of Service</Link>
          <Link to="/about" className="hover:text-pak-teal transition-all">About Us</Link>
          <Link to="/contact" className="hover:text-pak-teal transition-all">Contact Us</Link>
        </div>
        
        <p className="text-base font-bold text-white/50 tracking-wide">
          {t('footer_copy', { year: new Date().getFullYear() })}
        </p>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-white/20">
          {t('footer_sub')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
