import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ChevronLeft, MapPin, MessageSquare, Info } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any;
}

const RecoveryModal: React.FC<RecoveryModalProps> = ({ isOpen, onClose, entry }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    foundBy: 'Unlock Technician ke zariye',
    finderCity: '',
    recoveryNote: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.finderCity.trim()) {
      toast.error('Kahan se mila? City batayein.');
      return;
    }

    setLoading(true);
    const t = toast.loading("Recording your success story...");

    try {
      // Update phone status to 'recovered'
      await updateDoc(doc(db, 'phones', entry.id), {
        status: 'recovered',
        recoveredAt: serverTimestamp(),
        foundBy: form.foundBy,
        finderCity: form.finderCity,
        recoveryNote: form.recoveryNote
      });
      
      // Add to recoveries collection
      await addDoc(collection(db, 'recoveries'), {
        phoneId: entry.id,
        ownerName: entry.ownerName,
        brand: entry.brand,
        model: entry.model,
        city: entry.address?.city || entry.city || 'Unknown',
        foundBy: form.foundBy,
        finderCity: form.finderCity,
        recoveryNote: form.recoveryNote,
        recoveredAt: serverTimestamp()
      });
      
      toast.success('🎉 Mubarak Ho! Aapki story record ho gayi!', { id: t });
      onClose();
    } catch (error: any) {
      console.error("Recovery error:", error);
      toast.error('Record karne mein masla hua. Dubara koshish karein.', { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-navy-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-pak-teal/20 text-pak-teal">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Mubarak Ho!</h2>
                  <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Phone Wapas Mila?</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                {/* Found By */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Kiske zariye mila?</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pak-teal/50 group-focus-within:text-pak-teal transition-colors">
                      <Info size={18} />
                    </div>
                    <select
                      value={form.foundBy}
                      onChange={(e) => setForm({ ...form, foundBy: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-pak-teal/50 focus:bg-white/10 transition-all appearance-none"
                    >
                      <option className="bg-navy-900" value="Unlock Technician ke zariye">Unlock Technician ke zariye</option>
                      <option className="bg-navy-900" value="Police ke zariye">Police ke zariye</option>
                      <option className="bg-navy-900" value="Khud Dhundha">Khud Dhundha</option>
                      <option className="bg-navy-900" value="Doosre tarike se">Doosre tarike se</option>
                    </select>
                  </div>
                </div>

                {/* Finder City */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Kahan se mila? (City/Area)</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pak-teal/50 group-focus-within:text-pak-teal transition-colors">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      value={form.finderCity}
                      onChange={(e) => setForm({ ...form, finderCity: e.target.value })}
                      placeholder="Jaise: Karachi, Lahore"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-pak-teal/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                {/* Recovery Note */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Apna tajurba share karein (Optional)</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-pak-teal/50 group-focus-within:text-pak-teal transition-colors">
                      <MessageSquare size={18} />
                    </div>
                    <textarea
                      value={form.recoveryNote}
                      onChange={(e) => setForm({ ...form, recoveryNote: e.target.value })}
                      placeholder="Kaise mila? Kya hua? Dusron ke liye helpful hoga"
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-pak-teal/50 focus:bg-white/10 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all text-xs"
                >
                  <ChevronLeft size={18} />
                  Wapas Jao
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl bg-pak-teal text-navy-900 font-black uppercase tracking-widest hover:bg-white transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(46,196,182,0.3)]"
                >
                  <CheckCircle2 size={18} />
                  Confirm — Phone Mil Gaya!
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecoveryModal;
