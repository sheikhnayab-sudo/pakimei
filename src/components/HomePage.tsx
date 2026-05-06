import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, ShieldCheck, AlertCircle, Phone, Smartphone, History, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const [imei, setImei] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (imei.length >= 14) {
      navigate(`/search?q=${imei}`);
    }
  };

  const features = [
    {
      icon: <ShieldCheck className="text-pak-teal" size={32} />,
      title: t('feat_database_title'),
      desc: t('feat_database_desc')
    },
    {
      icon: <Smartphone className="text-pak-red" size={32} />,
      title: t('feat_search_title'),
      desc: t('feat_search_desc')
    },
    {
      icon: <History className="text-pak-teal" size={32} />,
      title: t('feat_logs_title'),
      desc: t('feat_logs_desc')
    }
  ];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  <span className="block text-pak-red drop-shadow-lg">{t('hero_tagline')}</span>
                  <span className="block drop-shadow-xl">{t('hero_title')}</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl font-medium leading-relaxed">
                  {t('hero_desc')}
                </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-10 max-w-xl"
            >
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-white/40 group-focus-within:text-pak-teal">
                    <Search size={22} />
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('search_placeholder')}
                    className="glass-input block w-full rounded-2xl py-6 pl-14 pr-36 text-xl text-white shadow-2xl placeholder:text-white/30"
                  />
                  <button
                    type="submit"
                    className="btn-glass-primary absolute right-3 top-3 bottom-3 rounded-xl px-8 font-black text-white text-xs uppercase tracking-widest"
                  >
                    {t('search_btn')}
                  </button>
                </form>
              <div className="mt-4 flex justify-center gap-4 text-xs font-semibold uppercase tracking-widest text-pak-muted">
                <span>15-Digit IMEI</span>
                <span className="opacity-20">|</span>
                <span>Instant Result</span>
                <span className="opacity-20">|</span>
                <span>Technician Verified</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats/Quick Actions */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            to="/register"
            className="glass group flex flex-col items-start gap-4 rounded-3xl p-10 transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="rounded-2xl bg-pak-red/20 p-5 text-pak-red border border-pak-red/30 group-hover:bg-pak-red/30 shadow-lg shadow-pak-red/10">
              <AlertCircle size={36} />
            </div>
            <div>
              <h3 className="font-display text-3xl font-bold text-white">{t('action_register_title')}</h3>
              <p className="mt-3 text-white/70 text-base leading-relaxed">{t('action_register_desc')}</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-sm font-black text-pak-red uppercase tracking-widest group-hover:gap-4 transition-all">
              {t('action_register_btn')} <ChevronRight size={20} />
            </div>
          </Link>

          <Link
            to="/how-it-works"
            className="glass group flex flex-col items-start gap-4 rounded-3xl p-10 transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="rounded-2xl bg-pak-teal/20 p-5 text-pak-teal border border-pak-teal/30 group-hover:bg-pak-teal/30 shadow-lg shadow-pak-teal/10">
              <Phone size={36} />
            </div>
            <div>
              <h3 className="font-display text-3xl font-bold text-white">{t('action_guide_title')}</h3>
              <p className="mt-3 text-white/70 text-base leading-relaxed">{t('action_guide_desc')}</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-sm font-black text-pak-teal uppercase tracking-widest group-hover:gap-4 transition-all">
              {t('action_guide_btn')} <ChevronRight size={20} />
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-6">{f.icon}</div>
                <h4 className="font-display text-xl font-bold text-white">{f.title}</h4>
                <p className="mt-2 text-sm text-pak-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
