import React from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Clock, Copy, Send, MessageSquare, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactPage: React.FC = () => {
  const email = 'sheikhnayab@gmail.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard! ✅');
  };

  const contactReasons = [
    {
      title: "🚨 Fake Entry Report",
      desc: "EN: If you spot a fake or incorrect entry, report it immediately. | UR: Agar aapko koi fake entry nazar aaye toh foran report karein.",
      icon: <AlertTriangle className="text-pak-red" size={24} />
    },
    {
      title: "🛠 Technical Issue",
      desc: "EN: Facing problems with the website? Reach out for support. | UR: Website mein koi masla aa raha hai toh humein batayein.",
      icon: <MessageSquare className="text-pak-teal" size={24} />
    },
    {
      title: "🗑 Entry Deletion",
      desc: "EN: Want to remove your registered phone? Email us your request. | UR: Apni entry delete karwanay ke liye request bhejin.",
      icon: <Trash2 className="text-pak-orange" size={24} />
    },
    {
      title: "💡 Suggestion",
      desc: "EN: Have an idea to improve PakIMEI? We'd love to hear it. | UR: PakIMEI ko behtar bananay ke liye koi tajweez dein.",
      icon: <ShieldCheck className="text-white/50" size={24} />
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* HERO SECTION */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter outline-glow">
              📬 Contact <span className="text-pak-teal">Us</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-medium">
              Koi masla? Fake entry report karni hai? <br />
              <span className="text-pak-teal font-black">Hum yahan hain!</span>
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* CONTACT CARD */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-5 h-full"
          >
            <div className="card-glass p-8 rounded-3xl border border-white/10 shadow-2xl h-full flex flex-col justify-between">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 text-pak-teal mb-4">
                    <div className="bg-pak-teal/10 p-2 rounded-lg">
                      <Mail size={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Email Address</span>
                  </div>
                  <p className="text-white font-bold text-lg mb-4 truncate">{email}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyEmail}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Copy size={14} /> Copy
                    </button>
                    <a 
                      href={`mailto:${email}`}
                      className="flex-1 bg-pak-teal text-navy-900 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-lg shadow-pak-teal/20"
                    >
                      <Send size={14} /> Send
                    </a>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 text-pak-orange mb-3">
                    <div className="bg-pak-orange/10 p-2 rounded-lg">
                      <MapPin size={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Location</span>
                  </div>
                  <p className="text-white font-bold text-lg">Karachi, Pakistan</p>
                </div>

                <div>
                  <div className="flex items-center gap-3 text-white/40 mb-3">
                    <div className="bg-white/5 p-2 rounded-lg">
                      <Clock size={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Response Time</span>
                  </div>
                  <p className="text-white font-bold text-lg">24-48 hours mein reply</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CONTACT REASONS */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-7 flex flex-col gap-4"
          >
            {contactReasons.map((reason, index) => (
              <div 
                key={index}
                className="glass rounded-3xl p-6 border border-white/5 hover:border-white/20 transition-all group"
              >
                <div className="flex gap-5">
                  <div className="bg-white/5 p-4 rounded-2xl group-hover:scale-110 transition-transform h-fit">
                    {reason.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xl mb-2 tracking-tight">{reason.title}</h3>
                    <div className="space-y-1">
                      <p className="text-white/50 text-xs font-bold leading-relaxed">{reason.desc.split('|')[0].trim()}</p>
                      <p className="text-pak-teal/60 text-xs font-medium leading-relaxed italic">{reason.desc.split('|')[1]?.trim()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
