import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-white/10 py-16 px-4 text-center glass rounded-t-3xl border-b-0 border-x-0">
      <p className="text-base font-bold text-white/50 tracking-wide">
        {t('footer_copy', { year: new Date().getFullYear() })}
      </p>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-white/20">
        {t('footer_sub')}
      </p>
    </footer>
  );
};

export default Footer;
