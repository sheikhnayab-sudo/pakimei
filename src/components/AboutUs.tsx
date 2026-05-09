import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, Rocket, Heart, Globe, Languages, ShieldCheck } from 'lucide-react';

const AboutUs: React.FC = () => {
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
            About <span className="text-pak-teal">Us</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-medium">
            The story behind Pakistan's first community-driven IMEI registry.
          </p>
        </motion.div>

        <div className="space-y-12">
          {/* Founder Section */}
          <section className="glass rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12">
              <Users size={200} />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Heart className="text-pak-red" size={24} />
                Our Origin Story
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white/70">
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg border-b border-pak-teal/20 pb-2">English</h3>
                  <p>PakIMEI was created by <span className="text-pak-teal font-bold">Sheikh Nayab</span> from Karachi. As a mobile software professional with years of experience, Sheikh witnessed countless people losing their expensive phones with no system to track or block them locally across independent workshops.</p>
                  <p>In 2025, the platform was launched with a simple mission: Use the power of community to reduce mobile theft in Pakistan by connecting victims directly with technicians.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg border-b border-pak-teal/20 pb-2">Roman Urdu</h3>
                  <p>PakIMEI Karachi ke rehne walay <span className="text-pak-teal font-bold">Sheikh Nayab</span> ne banayi hai. Mobile software ki field mein barson ke tajurbe ke baad, unhon ne dekha ke log mehngay phones kho dete hain lekin koi aisa system nahi jo local workshops par tracking mein madad karay.</p>
                  <p>2025 mein is platform ka aghaz hua takay Pakistan mein mobile chori ko roka ja sakay. Hamara maqsad logon aur technicians ko aapas mein jorna hai.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="glass rounded-3xl p-8 border border-white/10 shadow-xl">
              <div className="flex items-center gap-3 mb-4 text-pak-teal">
                <Target size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">Our Mission</h3>
              </div>
              <div className="space-y-4 text-sm text-white/70">
                <p><span className="text-white font-bold">EN:</span> To empower every Pakistani to protect their digital identity and device ownership through a transparent, community-verified registry.</p>
                <p><span className="text-white font-bold">UR:</span> Har Pakistani ko is qabil banana ke woh apni digital pehchan aur mobile ki milkiyat ko aik transparent system ke zariye mehfooz kar sakay.</p>
              </div>
            </section>

            <section className="glass rounded-3xl p-8 border border-white/10 shadow-xl">
              <div className="flex items-center gap-3 mb-4 text-pak-orange">
                <Rocket size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">Our Vision</h3>
              </div>
              <div className="space-y-4 text-sm text-white/70">
                <p><span className="text-white font-bold">EN:</span> A Pakistan where every mobile technician checks the PakIMEI registry before unlocking or servicing a device, making stolen phones impossible to resell.</p>
                <p><span className="text-white font-bold">UR:</span> Aik aisa Pakistan jahan har mobile technician kisi bhi phone ko kholnay se pehle PakIMEI check karay, takay chori shuda mobile bechna namumkin ho jaye.</p>
              </div>
            </section>
          </div>

          {/* Key Value */}
          <section className="glass rounded-3xl p-8 border border-white/10 shadow-2xl bg-white/5">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-pak-teal" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Community Power</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white/70">
              <p><span className="text-white font-bold">EN:</span> This platform is built for you. By registering your lost devices here, you are alerting thousands of shopkeepers and potential buyers about the status of your phone.</p>
              <p><span className="text-white font-bold">UR:</span> Yeh platform aap ke liye bana hai. Jab aap apna phone yahan register karte hain, toh aap hazaron dukan-daron aur khareedaron ko hoshyar kar dete hain.</p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center text-white/40 text-sm">
          Proudly serving Pakistan since 2025 | Developed by Sheikh Nayab
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
