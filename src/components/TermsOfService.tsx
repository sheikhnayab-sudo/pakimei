import React from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle2, AlertCircle, Scale, Gavel, Globe, Languages } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter outline-glow">
            Terms of <span className="text-pak-teal">Service</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-medium">
            Rules and regulations for using the PakIMEI platform.
          </p>
        </motion.div>

        <div className="space-y-12">
          {/* English Section */}
          <section className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="text-pak-teal" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">English Version</h2>
            </div>
            
            <div className="space-y-8 text-white/70 leading-relaxed">
              <div className="flex gap-4">
                <div className="bg-pak-teal/10 p-3 rounded-2xl h-fit">
                  <CheckCircle2 className="text-pak-teal" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Ownership & Responsibility</h3>
                  <p>You must ONLY register a phone that belongs to you. Creating entries for devices you do not own or have legal rights to is strictly prohibited.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-pak-red/10 p-3 rounded-2xl h-fit">
                  <AlertCircle className="text-pak-red" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">False/Fake Entries</h3>
                  <p>Providing false or misleading information is a violation of our terms. PakIMEI reserves the right to remove any entry suspected of being fake without prior notice.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/5 p-3 rounded-2xl h-fit">
                  <Scale className="text-white/40" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Liability Disclaimer</h3>
                  <p>PakIMEI is a community platform and is not responsible for any disputes, legal issues, or financial losses arising from the use of its data. We do not provide legal guarantees regarding the recovery of your device.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-pak-orange/10 p-3 rounded-2xl h-fit">
                  <Gavel className="text-pak-orange" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Service Provision</h3>
                  <p>This service is provided free of charge for the benefit of the community. We maintain the platform on a best-effort basis but provide no warranties regarding uptime or data accuracy.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Roman Urdu Section */}
          <section className="glass rounded-3xl p-8 border border-white/10 shadow-2xl bg-pak-teal/5">
            <div className="flex items-center gap-3 mb-6">
              <Languages className="text-pak-teal" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Roman Urdu Version</h2>
            </div>
            
            <div className="space-y-8 text-white/70 leading-relaxed">
              <div className="flex gap-4">
                <div className="bg-pak-teal/10 p-3 rounded-2xl h-fit">
                  <CheckCircle2 className="text-pak-teal" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Milkiyat Aur Zimmedari</h3>
                  <p>Aap sirf apna mobile register kar sakte hain. Kisi doosray ki cheez ko baghair ijazat hamaray system mein daalna mana hai.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-pak-red/10 p-3 rounded-2xl h-fit">
                  <AlertCircle className="text-pak-red" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Ghalat Maloomat (Fake Entries)</h3>
                  <p>Ghalat ya fake maloomat dena sakhti se mana hai. Hum kisi bhi aisi entry ko foran delete karne ka haq rakhte hain jo hamaray rules ke mutabiq na ho.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/5 p-3 rounded-2xl h-fit">
                  <Scale className="text-white/40" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Zimmedari Ka Inkaar</h3>
                  <p>PakIMEI sirf aik community platform hai. Kisi bhi qanooni maslay ya mali nuqsan ki zimmedari PakIMEI par nahi hogi. Hum mobile wapas dilwanay ki qanooni guarantee nahi dete.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-pak-orange/10 p-3 rounded-2xl h-fit">
                  <Gavel className="text-pak-orange" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Service Ka Istemal</h3>
                  <p>Yeh service bilkul muft (free) hai. Hum poori koshish karte hain ke system sahi chalay, lekin accurate data ya system uptime ki koi guarantee nahi hai.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center text-white/40 text-sm">
          Last updated: May 2025 | PakIMEI Terms and Conditions
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
