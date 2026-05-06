import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Smartphone, MapPin, Calendar, Clock, Lock, 
  MessageCircle, Phone, Loader2, AlertTriangle, ChevronDown,
  Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { 
  collection, query, where, orderBy, limit, onSnapshot, 
  QueryDocumentSnapshot, DocumentData, doc, deleteDoc 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

// Cache for phones to show instantly on navigation
const phonesCache = {
  data: [] as Report[],
  lastDoc: null as QueryDocumentSnapshot<DocumentData> | null
};

interface Report {
  id: string;
  ownerName: string;
  brand: string;
  model: string;
  color: string;
  imei: string;
  lossDateTime: string;
  lossLocation: string;
  reportType: 'stolen' | 'lost';
  status: string;
  createdAt: any;
  contactNumber: string;
  whatsappNumber: string;
  city: string;
  userId: string;
}

const SkeletonCard = () => (
  <div className="glass rounded-3xl p-6 border border-white/10 animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-4 w-24 bg-white/10 rounded-full" />
      <div className="h-4 w-32 bg-white/5 rounded-full" />
    </div>
    <div className="h-8 w-64 bg-white/10 rounded-lg mb-4" />
    <div className="h-4 w-40 bg-white/5 rounded-md mb-8" />
    <div className="space-y-4 border-t border-white/5 pt-6">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-white/5 rounded" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-white/5 rounded" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-white/5 rounded" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>
    </div>
  </div>
);

const FeedPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, login } = useAuth();
  const [phones, setPhones] = useState<Report[]>(phonesCache.data);
  const [loading, setLoading] = useState(phonesCache.data.length === 0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isRefreshing = useRef(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'phones', deleteId));
      toast.success('Entry successfully delete ho gayi ✅');
      setPhones(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error('Delete nahi ho saka. Dobara try karein.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    // Simplified query to fix performance and avoiding index requirements
    const q = query(
      collection(db, 'phones'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];

      // Sort client-side by createdAt to bypass server-side index requirement
      data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setPhones(data);
      phonesCache.data = data;
      setLoading(false);
    }, (error) => {
      console.error("Feed Query Error:", error);
      setLoading(false);
    });

    localStorage.setItem('pakimei_last_visited_feed', Date.now().toString());

    return () => unsubscribe();
  }, []);

  const maskIMEI = (imei: string) => {
    if (!imei) return "●●●●●●●●●●●●●●●";
    if (imei.length < 5) return imei;
    const firstTwo = imei.substring(0, 2);
    const lastTwo = imei.substring(imei.length - 2);
    return `${firstTwo}●●●●●●●●●●●${lastTwo}`;
  };

  const maskText = (text: string) => "●●●●";
  const maskPhone = (phone: string) => {
    if (!phone) return "03●●●●●●●●●";
    return phone.substring(0, 3) + "●●●●●●●●";
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic"
        >
          {t('feed_title')}
        </motion.h1>
        <p className="mt-4 text-white/60 max-w-2xl mx-auto text-lg">
          {t('feed_subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : phones.length === 0 ? (
        <div className="text-center py-20 card-glass rounded-3xl p-10 border border-white/10">
          <Smartphone size={64} className="mx-auto text-white/20 mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">{t('feed_empty')}</h3>
          <p className="text-white/40">Abhi tak koi entry nahi hui. Pehle register karne wale banein!</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phones.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 20) * 0.05 }}
                className="glass rounded-3xl border border-white/10 overflow-hidden flex flex-col relative"
              >
                {/* Header/Badge */}
                <div className={`p-4 flex justify-between items-center ${report.reportType === 'stolen' ? 'bg-pak-red/10' : 'bg-pak-teal/10'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full animate-pulse ${report.reportType === 'stolen' ? 'bg-pak-red' : 'bg-pak-teal'}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${report.reportType === 'stolen' ? 'text-pak-red' : 'text-pak-teal'}`}>
                       {report.reportType === 'stolen' ? '🚨 STOLEN' : '⚠️ LOST'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {report.city}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {getTimeAgo(report.createdAt)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
                    {report.brand} {report.model}
                  </h3>
                  <div className="flex items-center gap-2 text-white/50 text-xs font-mono mb-6">
                    <Lock size={12} className="text-pak-orange" />
                    <span>IMEI: {currentUser ? report.imei : maskIMEI(report.imei)}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-white/5 pt-6 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 font-medium">📅 {t('feed_loss_date')}</span>
                      <span className="text-white font-bold">{formatDate(report.lossDateTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 font-medium">📍 Location</span>
                      <span className="text-white font-bold truncate max-w-[150px]">{report.lossLocation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 font-medium">👤 {t('feed_registered_by')}</span>
                      <span className="text-white font-bold">
                        {currentUser ? report.ownerName : maskText(report.ownerName)} — {report.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Only for Logged In */}
                <div className="p-4 border-t border-white/5 bg-white/5">
                  {currentUser ? (
                    <div className="grid grid-cols-2 gap-3">
                      <a 
                        href={`https://wa.me/${report.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#25D366]/20 text-[#25D366] py-3 rounded-xl text-sm font-bold border border-[#25D366]/30 hover:bg-[#25D366]/30 transition-all"
                      >
                        <MessageCircle size={18} /> WhatsApp
                      </a>
                      <a 
                        href={`tel:${report.contactNumber}`}
                        className="flex items-center justify-center gap-2 bg-pak-teal/20 text-pak-teal py-3 rounded-xl text-sm font-bold border border-pak-teal/30 hover:bg-pak-teal/30 transition-all"
                      >
                        <Phone size={18} /> Contact
                      </a>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center z-10 transition-all pointer-events-none group-hover:pointer-events-auto">
                      <div className="p-6 rounded-2xl glass border border-white/20 shadow-2xl pointer-events-auto">
                        <Lock className="mx-auto text-pak-orange mb-3" size={24} />
                        <p className="text-white text-sm font-bold mb-4">{t('feed_login_prompt')}</p>
                        <button 
                          onClick={() => login()}
                          className="bg-white text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                          Unlock with Google
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Owner Delete Option */}
                {currentUser && currentUser.uid === report.userId && (
                  <div className="absolute bottom-4 right-4 z-20">
                    <button
                      onClick={() => setDeleteId(report.id)}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all"
                      style={{
                        background: 'rgba(230, 57, 70, 0.15)',
                        color: 'rgba(230, 57, 70, 0.8)',
                        borderColor: 'rgba(230, 57, 70, 0.3)'
                      }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass p-8 text-center"
            >
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-pak-red/10 p-5 text-pak-red border border-pak-red/20">
                  <AlertTriangle size={40} />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                ⚠️ Entry Delete Karein?
              </h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                Kya aap waqai apni entry delete karna chahte hain? 
                <br />
                <span className="font-bold text-pak-red">Yeh action wapas nahi ho sakta.</span>
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-glass-primary w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  Haan, Delete Karein
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-white/40 hover:text-white transition-colors"
                >
                  Nahi, Wapas Jao
                </button>
              </div>

              <button 
                onClick={() => setDeleteId(null)}
                className="absolute right-4 top-4 text-white/20 hover:text-white"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedPage;
