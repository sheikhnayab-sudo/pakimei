import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
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
  QueryDocumentSnapshot, DocumentData, doc, deleteDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import RecoveryModal from './RecoveryModal';

import { formatWhatsAppNumber } from '../constants';

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
  updatedAt?: any;
  proofType?: 'police_report' | 'box_image' | 'purchase_slip';
  proofImageUrl?: string;
  selfieImageUrl?: string;
}

const SkeletonCard = () => (
  <div className="glass rounded-3xl p-6 border border-white/10 animate-pulse bg-white/[0.05]">
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

const PhoneCard = memo(({ 
  report, 
  idx, 
  currentUser, 
  t, 
  signInWithGoogle, 
  onEdit, 
  onDelete, 
  onReportFake, 
  onRecovery,
  onShare,
  maskIMEI,
  maskText,
  formatDate,
  getTimeAgo
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: (idx % 20) * 0.05 }}
    className="glass rounded-3xl border border-white/10 overflow-hidden flex flex-col relative group"
  >
    {/* Header/Badge */}
    <div className={`p-4 flex justify-between items-center ${report.reportType === 'stolen' ? 'bg-pak-red/10' : 'bg-pak-teal/10'}`}>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full animate-pulse ${report.reportType === 'stolen' ? 'bg-pak-red' : 'bg-pak-teal'}`} />
        <span className={`text-xs font-black uppercase tracking-widest ${report.reportType === 'stolen' ? 'text-pak-red' : 'text-pak-teal'}`}>
            {report.reportType === 'stolen' ? '🚨 STOLEN' : '⚠️ LOST'}
        </span>
        {report.updatedAt && (
          <span className="text-pak-teal text-[9px] font-black uppercase tracking-[0.2em] ml-2 animate-pulse">
            ✏️ Updated
          </span>
        )}
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
        {/* Proof Section */}
        {report.proofType && (
          <div className="mb-2">
            <span className="text-white/40 font-medium block mb-2">📎 Uploaded Proof:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                report.proofType === 'police_report' ? 'bg-pak-red/20 text-pak-red border-pak-red/30' :
                report.proofType === 'box_image' ? 'bg-pak-teal/20 text-pak-teal border-pak-teal/30' :
                'bg-pak-orange/20 text-pak-orange border-pak-orange/30'
              }`}>
                {report.proofType === 'police_report' && "🚨 Police FIR Copy"}
                {report.proofType === 'box_image' && "📦 Mobile Box Photo"}
                {report.proofType === 'purchase_slip' && "🧾 Purchase Slip"}
              </span>
              
              {currentUser && report.proofImageUrl && report.proofImageUrl !== 'uploading' && report.proofImageUrl !== null ? (
                <div className="flex flex-col gap-2">
                  <img 
                    src={report.proofImageUrl + '?w=400&q=auto&f=auto'} 
                    alt="Proof"
                    loading="lazy"
                    className="w-[121px] h-[121px] object-cover rounded-lg border border-white/10 shadow-lg"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                  <a 
                    href={report.proofImageUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="bg-pak-teal/15 border border-pak-teal/40 text-pak-teal px-3 py-1.5 rounded-lg text-[10px] font-bold text-center hover:bg-pak-teal/25 transition-all flex items-center justify-center gap-1"
                  >
                    📥 Proof Download Karein
                  </a>
                </div>
              ) : currentUser && report.proofImageUrl === 'uploading' ? (
                <div className="flex items-center gap-2 text-pak-orange text-[10px] font-bold italic">
                  <Loader2 size={12} className="animate-spin" />
                  ⏳ Proof abhi available nahi
                </div>
              ) : (
                <div className="text-white/40 text-[10px] font-bold italic">
                  📎 Koi proof upload nahi ki gayi
                </div>
              )}
            </div>
          </div>
        )}

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
          <div className="flex items-center gap-2">
            {currentUser && report.selfieImageUrl && report.selfieImageUrl !== 'uploading' && (
              <img 
                src={report.selfieImageUrl + '?w=100&q=auto&f=auto'} 
                alt="Owner"
                loading="lazy"
                className="w-[30px] h-[30px] rounded-full object-cover border border-pak-teal/50"
              />
            )}
            <span className="text-white font-bold">
              {currentUser ? report.ownerName : maskText(report.ownerName)} — {report.city}
            </span>
          </div>
        </div>
      </div>

      {/* Share button visible to all */}
      <button
        onClick={() => onShare(report)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(37, 211, 102, 0.15)',
          border: '1.5px solid rgba(37, 211, 102, 0.5)',
          color: '#25D366',
          padding: '0.6rem 1.25rem',
          borderRadius: 10,
          cursor: 'pointer',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600,
          fontSize: '0.9rem',
          width: '100%',
          justifyContent: 'center',
          marginTop: '1.5rem',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(37, 211, 102, 0.25)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)';
        }}
      >
        💬 WhatsApp Pe Share Karein
      </button>
    </div>

    {/* Actions Only for Logged In */}
    <div className="p-4 border-t border-white/5 bg-white/5">
      {currentUser ? (
        <div className="grid grid-cols-2 gap-3">
          <a 
            href={`https://wa.me/${formatWhatsAppNumber(report.whatsappNumber)}`}
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
              onClick={signInWithGoogle}
              className="bg-white text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Unlock with Google
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Owner/Reporter Options */}
    {currentUser && (
      <div className="p-4" style={{ 
        borderTop: '1px solid rgba(255,255,255,0.1)', 
        paddingTop: '1rem', 
        marginTop: '1rem' 
      }}>
        {currentUser.uid === report.userId ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onEdit(report)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(46, 196, 182, 0.15)',
                border: '1.5px solid rgba(46, 196, 182, 0.5)',
                color: '#2ec4b6',
                padding: '0.6rem 1.25rem',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: '0.9rem',
                width: '100%',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(46, 196, 182, 0.3)';
                e.currentTarget.style.borderColor = '#2ec4b6';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(46, 196, 182, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(46, 196, 182, 0.5)';
              }}
            >
              ✏️ Entry Edit Karein
            </button>
            <button
              onClick={() => onDelete(report.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(230, 57, 70, 0.15)',
                border: '1.5px solid rgba(230, 57, 70, 0.5)',
                color: '#e63946',
                padding: '0.6rem 1.25rem',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: '0.9rem',
                width: '100%',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(230,57,70,0.3)';
                e.currentTarget.style.borderColor = '#e63946';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(230,57,70,0.15)';
                e.currentTarget.style.borderColor = 'rgba(230,57,70,0.5)';
              }}
            >
              🗑️ Apni Entry Delete Karein
            </button>
            
            {report.status !== 'recovered' && (
              <button
                onClick={() => onRecovery(report)}
                className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:bg-pak-teal/20"
                style={{
                  background: 'rgba(46, 196, 182, 0.15)',
                  border: '1.5px solid rgba(46, 196, 182, 0.5)',
                  color: '#2ec4b6',
                }}
              >
                ✅ Mujhe Mera Phone Mil Gaya!
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onReportFake(report.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(244, 162, 97, 0.15)',
              border: '1.5px solid rgba(244, 162, 97, 0.5)',
              color: '#f4a261',
              padding: '0.6rem 1.25rem',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              fontSize: '0.9rem',
              width: '100%',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(244,162,97,0.3)';
              e.currentTarget.style.borderColor = '#f4a261';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(244,162,97,0.15)';
              e.currentTarget.style.borderColor = 'rgba(244,162,97,0.5)';
            }}
          >
            🚩 Report Fake Entry
          </button>
        )}
      </div>
    )}
  </motion.div>
));

const FeedPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, signInWithGoogle } = useAuth();
  const [phones, setPhones] = useState<Report[]>(phonesCache.data);
  const [loading, setLoading] = useState(phonesCache.data.length === 0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reportFakeId, setReportFakeId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reportingFake, setReportingFake] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Report | null>(null);
  const [editForm, setEditForm] = useState({
    model: '',
    color: '',
    lossLocation: '',
    description: '',
    contactNumber: '',
    whatsappNumber: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [recoveryEntry, setRecoveryEntry] = useState<Report | null>(null);
  const isRefreshing = useRef(false);

  const handleEdit = (report: Report) => {
    setEditingEntry(report);
    setEditForm({
      model: report.model || '',
      color: report.color || '',
      lossLocation: report.lossLocation || '',
      description: (report as any).description || '',
      contactNumber: report.contactNumber || '',
      whatsappNumber: report.whatsappNumber || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    try {
      setSavingEdit(true);
      const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'phones', editingEntry.id), {
        ...editForm,
        updatedAt: serverTimestamp()
      });
      toast.success('Entry update ho gayi! ✅');
      setPhones(prev => prev.map(p => p.id === editingEntry.id ? { ...p, ...editForm, updatedAt: { seconds: Date.now()/1000 } } : p));
      setEditingEntry(null);
    } catch (err) {
      console.error("Update Error:", err);
      toast.error('Update nahi hua. Dobara try karein.');
    } finally {
      setSavingEdit(false);
    }
  };

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

  const handleReportSubmit = async () => {
    if (!reportFakeId || !currentUser) return;

    try {
      setReportingFake(true);
      await addDoc(collection(db, 'reports'), {
        phoneId: reportFakeId,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email,
        createdAt: serverTimestamp(),
        reason: 'User flagged as fake/suspicious'
      });
      toast.success('Shukriya! Humari team is entry ko jald check karegi. 🚩');
      setReportFakeId(null);
    } catch (err) {
      console.error("Report Error:", err);
      toast.error('Report send nahi ho saki. Internet check karein.');
    } finally {
      setReportingFake(false);
    }
  };

  const shareOnWhatsApp = (entry: Report) => {
    const waNum = formatWhatsAppNumber(entry.whatsappNumber);
    const message = 
      `🚨 *Chori Shuda Phone Alert — PakIMEI*\n\n` +
      `📱 Phone: ${entry.brand} ${entry.model}\n` +
      `🔢 IMEI: ${entry.imei}\n` +
      `📍 City: ${entry.city || 'N/A'}\n` +
      `📅 Tarikh: ${entry.lossDateTime || 'N/A'}\n\n` +
      `Agar ye phone unlock hone aaye to ` +
      `owner se rabta karein: +${waNum}\n\n` +
      `🔍 IMEI Check karein:\n` +
      `https://${window.location.hostname}`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
      handleFirestoreError(error, OperationType.GET, 'phones');
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
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
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
              <PhoneCard 
                key={report.id}
                report={report}
                idx={idx}
                currentUser={currentUser}
                t={t}
                signInWithGoogle={signInWithGoogle}
                onEdit={handleEdit}
                onDelete={setDeleteId}
                onReportFake={setReportFakeId}
                onRecovery={setRecoveryEntry}
                onShare={shareOnWhatsApp}
                maskIMEI={maskIMEI}
                maskText={maskText}
                formatDate={formatDate}
                getTimeAgo={getTimeAgo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Report Fake Modal */}
      <AnimatePresence>
        {reportFakeId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportFakeId(null)}
              className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass p-8 text-center"
            >
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-pak-orange/10 p-5 text-pak-orange border border-pak-orange/20">
                  <AlertTriangle size={40} />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                🚩 Report Fake Entry?
              </h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                Kya aap ko lagta hai ke yeh entry galat ya fake hai? Humari admin team isay check karegi.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReportSubmit}
                  disabled={reportingFake}
                  className="w-full bg-pak-orange text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-pak-orange/80 transition-colors"
                >
                  {reportingFake ? <Loader2 className="animate-spin" size={18} /> : null}
                  Haan, Report Karein
                </button>
                <button
                  onClick={() => setReportFakeId(null)}
                  disabled={reportingFake}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-white/40 hover:text-white transition-colors"
                >
                  Nahi, Wapas Jao
                </button>
              </div>

              <button 
                onClick={() => setReportFakeId(null)}
                className="absolute right-4 top-4 text-white/20 hover:text-white"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Edit Entry Modal */}
      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingEntry(null)}
              className="absolute inset-0 bg-navy-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass p-8 overflow-y-auto max-h-[90vh] z-10"
            >
              <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight italic">
                ✏️ Edit Entry
              </h3>

              <div className="space-y-6">
                {/* Non-editable */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">IMEI</label>
                    <input disabled value={editingEntry.imei} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Owner CNIC</label>
                    <input disabled value={(editingEntry as any).nicNumber || '●●●●●●●●'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed" />
                  </div>
                </div>

                {/* Editable */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Model</label>
                    <input 
                      value={editForm.model} 
                      onChange={e => setEditForm({...editForm, model: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal transition-all outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Color</label>
                    <input 
                      value={editForm.color} 
                      onChange={e => setEditForm({...editForm, color: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal transition-all outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Loss Location</label>
                  <input 
                    value={editForm.lossLocation} 
                    onChange={e => setEditForm({...editForm, lossLocation: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal transition-all outline-none" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Details</label>
                  <textarea 
                    value={editForm.description} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal transition-all outline-none h-24 resize-none" 
                    placeholder="Wazahat karein..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Mobile Number</label>
                    <input 
                      value={editForm.contactNumber} 
                      onChange={e => setEditForm({...editForm, contactNumber: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal transition-all outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">WhatsApp</label>
                    <input 
                      value={editForm.whatsappNumber} 
                      onChange={e => setEditForm({...editForm, whatsappNumber: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal transition-all outline-none" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="w-full bg-pak-teal text-navy-950 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                  >
                    {savingEdit ? <Loader2 className="animate-spin" size={18} /> : null}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingEntry(null)}
                    disabled={savingEdit}
                    className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-white/40 hover:text-white transition-colors"
                  >
                    Wapas Jao
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setEditingEntry(null)}
                className="absolute right-4 top-4 text-white/20 hover:text-white"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RecoveryModal 
        isOpen={!!recoveryEntry}
        onClose={() => setRecoveryEntry(null)}
        entry={recoveryEntry}
      />
    </div>
  );
};

export default FeedPage;
