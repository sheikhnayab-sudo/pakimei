import React from 'react';
import { motion } from 'motion/react';
import { Search, PlusCircle, ShieldCheck, UserCheck, Smartphone, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: <PlusCircle size={32} />,
      title: t('how_step1_title'),
      desc: t('how_step1_desc'),
      color: 'text-pak-red'
    },
    {
      icon: <ShieldCheck size={32} />,
      title: t('how_step2_title'),
      desc: t('how_step2_desc'),
      color: 'text-pak-teal'
    },
    {
      icon: <Search size={32} />,
      title: t('how_step3_title'),
      desc: t('how_step3_desc'),
      color: 'text-pak-teal'
    },
    {
      icon: <UserCheck size={32} />,
      title: t('how_step4_title'),
      desc: t('how_step4_desc'),
      color: 'text-pak-red'
    }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg"
        >
          {t('nav_how_it_works')}
        </motion.h2>
        <p className="mt-6 text-white/70 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
          PakIMEI creates a digital barrier against the resale of stolen mobile devices in Pakistan.
        </p>
      </div>

      <div className="relative border-l border-white/5 md:border-l-0">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5 md:left-1/2 hidden md:block" />
        
        <div className="space-y-12">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className={`relative flex flex-col md:flex-row items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
            >
              <div className="flex flex-1 flex-col items-center md:items-start text-center md:text-left">
                <div className={`mb-6 rounded-2xl bg-white/5 border border-white/10 p-5 ${step.color} shadow-lg backdrop-blur-md`}>
                  {step.icon}
                </div>
                <h3 className="font-display text-3xl font-bold text-white tracking-tight">{step.title}</h3>
                <p className="mt-3 text-white/70 leading-relaxed font-medium text-base">{step.desc}</p>
              </div>
              
              <div className="md:absolute md:left-1/2 h-4 w-4 md:-translate-x-1/2 rounded-full border-4 border-navy-900 bg-pak-teal hidden md:block" />
              
              <div className="hidden flex-1 md:block" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-24 glass rounded-3xl p-10 border-l-8 border-pak-red backdrop-blur-xl">
        <div className="flex items-start gap-6">
          <Scale className="text-pak-red flex-shrink-0 drop-shadow-lg" size={40} />
          <div>
            <h4 className="font-display text-2xl font-bold text-white tracking-tight">{t('how_legal_title')}</h4>
            <p className="mt-4 text-white/70 text-base leading-relaxed font-medium">
              {t('how_legal_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
