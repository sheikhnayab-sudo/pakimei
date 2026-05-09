import React from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, Lock, Database, Trash2, Globe } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
            Privacy <span className="text-pak-teal">Policy</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-medium">
            PakIMEI data protection standards and privacy commitment.
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
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Introduction</h3>
                <p>Welcome to PakIMEI. We are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and safeguard your data.</p>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">Data We Collect</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Personal details: Name, NIC number, contact number.</li>
                  <li>Device information: IMEI number, phone brand, model, color.</li>
                  <li>Authentication: Google Login details (for verification only).</li>
                  <li>Proof documents: Images of FIR, Mobile Box, or Purchase Slips.</li>
                  <li>Verification: Live selfie photo (mandatory for registration).</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">How We Use Your Data</h3>
                <p>Your data is used strictly for identifying stolen or lost phones within our national registry. This information helps technicians and other users verify the status of a device before purchase or service.</p>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">Data Sharing & Security</h3>
                <p>We NEVER sell your data to third parties. Access to sensitive information (like NIC or full contact details) is strictly restricted to authenticated users. We use industry-standard security measures to protect your information.</p>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">Data Deletion</h3>
                <p>If you wish to have your data removed from our platform, please contact us at <span className="text-pak-teal font-bold">sheikhnayab@gmail.com</span> with your request.</p>
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
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Introduction</h3>
                <p>PakIMEI par aapka khush-amdeed. Hum aapki zati maloomat (personal information) ki hifazat ke liye pur-azam hain. Yeh policy batati hai ke hum aapka data kaise collect aur mehfooz karte hain.</p>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">Data Jo Hum Collect Karte Hain</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Zati tafseelat: Naam, NIC number, contact number.</li>
                  <li>Mobile ki maloomat: IMEI number, brand, model, rang.</li>
                  <li>Authentication: Google Login maloomat (sirf verification ke liye).</li>
                  <li>Saboot (Proof): FIR ki copy, Mobile Box ki photo, ya Purchase Slip.</li>
                  <li>Verification: Live selfie photo (registration ke liye lazmi hai).</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">Data Ka Istemal</h3>
                <p>Aapka data sirf chori ya gumshuda mobiles ki nishandahi ke liye istemal hota hai. Yeh maloomat technicians aur doosray users ko mobile khareednay ya check karnay mein madad deti hain.</p>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">Security Aur Sharing</h3>
                <p>Hum aapka data kabhi bhi kisi teesray fariq (third party) ko nahi bechtay. Aapki sensitive maloomat (jaise NIC) sirf login shuda users hi dekh sakte hain.</p>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-2">Data Deletion</h3>
                <p>Agar aap chahte hain ke aapka data hamaray system se khatam kar diya jaye, toh humein <span className="text-pak-teal font-bold">sheikhnayab@gmail.com</span> par email karein.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Contact info footer */}
        <div className="mt-12 text-center text-white/40 text-sm">
          Last updated: May 2025 | PakIMEI by Sheikh Nayab
        </div>
      </div>
    </div>
  );
};

// Internal icon component since I can't import Languages from lucide-react if I'm not sure of the exact name (it might be Type)
// Actually Languages is a standard lucide icon. I'll add it to the imports if I missed it.
import { Languages } from 'lucide-react';

export default PrivacyPolicy;
