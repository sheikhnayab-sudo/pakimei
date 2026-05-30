import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Smartphone, MapPin, Calendar, Clock, Lock, 
  MessageCircle, Phone, Loader2, AlertTriangle, ChevronDown,
  Trash2, X, Eye
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
  <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-950/45 backdrop-blur-xl p-4.5 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-3 w-20 bg-white/10 rounded-full" />
      <div className="h-3 w-24 bg-white/5 rounded-full" />
    </div>
    <div className="h-6 w-48 bg-white/10 rounded-lg mb-3" />
    <div className="h-4 w-32 bg-white/5 rounded-md mb-6" />
    <div className="space-y-3.5 border-t border-white/5 pt-4">
      <div className="flex justify-between">
        <div className="h-3.5 w-20 bg-white/5 rounded" />
        <div className="h-3.5 w-24 bg-white/10 rounded" />
      </div>
      <div className="flex justify-between">
        <div className="h-3.5 w-20 bg-white/5 rounded" />
        <div className="h-3.5 w-24 bg-white/10 rounded" />
      </div>
      <div className="flex justify-between">
        <div className="h-3.5 w-20 bg-white/5 rounded" />
        <div className="h-3.5 w-24 bg-white/10 rounded" />
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
    className="relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-950/45 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/10 hover:shadow-cyan-950/15 hover:shadow-xl group"
  >
    {/* Header/Badge Area with clean colored overlay */}
    <div className={`p-4 px-5 flex flex-wrap gap-2 justify-between items-center border-b border-white/5 ${
      report.reportType === 'stolen' ? 'bg-gradient-to-r from-red-500/10 to-transparent' : 'bg-gradient-to-r from-teal-500/10 to-transparent'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full animate-pulse ${
          report.reportType === 'stolen' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]' : 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)]'
        }`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${
          report.reportType === 'stolen' ? 'text-red-400' : 'text-teal-400'
        }`}>
          {report.reportType === 'stolen' ? '🚨 STOLEN' : '⚠️ LOST'}
        </span>
        {report.updatedAt && (
          <span className="text-teal-400 bg-teal-400/10 border border-teal-400/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ml-1 animate-pulse leading-none">
            ✏️ Updated
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-white/40 text-[11px] font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1"><MapPin size={11} className="text-white/30" /> {report.city}</span>
        <span className="flex items-center gap-1"><Clock size={11} className="text-white/30" /> {getTimeAgo(report.createdAt)}</span>
      </div>
    </div>

    {/* Content Area */}
    <div className="p-5 flex-1 flex flex-col">
      {/* Profile Section - compact header row */}
      {report.selfieImageUrl && report.selfieImageUrl !== 'uploading' && (
        <div className="flex items-center gap-3 mb-4 p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
          <div 
            className="relative cursor-pointer group/selfie flex-shrink-0"
            onClick={() => window.open(report.selfieImageUrl, '_blank')}
            title="View full-size selfie"
          >
            <img
              src={report.selfieImageUrl + '?w=150&q=auto&f=auto'}
              loading="lazy"
              alt="Owner"
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(46,196,182,0.6)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            />
            {/* Hover visual overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/selfie:opacity-100 transition-opacity duration-200">
              <Eye size={15} className="text-white" />
            </div>
            {/* Permanent view indicator badge */}
            <div className="absolute -bottom-1 -right-1 bg-teal-500 text-slate-950 p-0.5 rounded-full shadow-lg border border-slate-950 flex items-center justify-center w-4 h-4">
              <Eye size={10} className="stroke-[3]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-teal-400 bg-teal-400/5 border border-teal-400/10 px-1.5 py-0.5 rounded inline-block leading-none mb-1">
              🛡️ VERIFIED OWNER
            </div>
            <div className="font-display font-black text-white text-base truncate leading-snug">
              {currentUser ? report.ownerName : maskText(report.ownerName)}
            </div>
            <div className="text-[11px] text-white/50 flex items-center gap-1 mt-0.5 font-medium">
              📍 {report.city}
            </div>
          </div>
        </div>
      )}

      {/* Brand & Model styling */}
      <div className="mb-3.5">
        <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none mb-2 font-display group-hover:text-teal-400 transition-colors duration-200">
          {report.brand} {report.model}
        </h3>
        
        {/* Secured IMEI indicators */}
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-white/[0.01] border border-dashed border-white/10 rounded-lg px-2.5 py-1 font-mono text-xs text-white/70 self-start">
            <Lock size={11} className="text-amber-500" />
            <span className="tracking-wide text-xs">
              IMEI 1: <span className="font-bold text-teal-300">{currentUser ? report.imei : maskIMEI(report.imei)}</span>
            </span>
          </div>
          {report.imei2 && report.imei2.trim() !== '' && (
            <div className="inline-flex items-center gap-1.5 bg-white/[0.01] border border-dashed border-white/10 rounded-lg px-2.5 py-1 font-mono text-xs text-white/70 self-start">
              <Lock size={11} className="text-amber-500" />
              <span className="tracking-wide text-xs">
                IMEI 2: <span className="font-bold text-teal-300">{currentUser ? report.imei2 : maskIMEI(report.imei2)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Information Row List */}
      <div className="mt-1 space-y-2 border-t border-white/5 pt-3.5 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.02]">
          <span className="text-white/40 font-medium tracking-wider uppercase text-[10px]">📅 Loss Date</span>
          <span className="text-white font-bold font-mono bg-white/[0.01] px-2 py-0.5 rounded border border-white/5">{formatDate(report.lossDateTime)}</span>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.02]">
          <span className="text-white/40 font-medium tracking-wider uppercase text-[10px]">📍 Last Location</span>
          <span className="text-white font-bold truncate max-w-[150px] text-right" title={report.lossLocation}>{report.lossLocation}</span>
        </div>
        <div className="flex items-center justify-between pb-2">
          <span className="text-white/40 font-medium tracking-wider uppercase text-[10px]">👤 Registered By</span>
          <span className="text-white font-bold text-right truncate max-w-[150px]">
            {currentUser ? report.ownerName : maskText(report.ownerName)} ({report.city})
          </span>
        </div>

        {/* Proof Document Segment */}
        {report.proofType && (
          <div className="mt-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">📎 EVIDENCE:</span>
            <div className="flex flex-col gap-2">
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  report.proofType === 'police_report' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  report.proofType === 'box_image' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {report.proofType === 'police_report' && "🚨 Police FIR"}
                  {report.proofType === 'box_image' && "📦 Mobile Box"}
                  {report.proofType === 'purchase_slip' && "🧾 Purchase Slip"}
                </span>
              </div>
              
              {currentUser && report.proofImageUrl && report.proofImageUrl !== 'uploading' ? (
                <div className="flex items-center gap-2.5 bg-white/[0.01] p-2 rounded-lg border border-white/5">
                  <img 
                    src={report.proofImageUrl + '?w=150&q=auto&f=auto'} 
                    alt="Proof Preview"
                    loading="lazy"
                    className="w-10 h-10 object-cover rounded border border-white/10 shadow hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => window.open(report.proofImageUrl, '_blank')}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block">DOC REF</span>
                    <a 
                      href={report.proofImageUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:text-white hover:underline text-xs font-bold flex items-center gap-0.5 mt-0.5"
                    >
                      📥 View Document
                    </a>
                  </div>
                </div>
              ) : currentUser && report.proofImageUrl === 'uploading' ? (
                <div className="flex items-center gap-1.5 text-amber-400/80 text-[10px] font-semibold italic">
                  <Loader2 size={10} className="animate-spin" />
                  ⏳ Uploading...
                </div>
              ) : (
                <div className="text-white/40 text-[10px] font-semibold italic">
                  📎 No proof image
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share button nicely integrated at the bottom of the card content */}
      <button
        onClick={() => onShare(report)}
        className="mt-4 flex items-center justify-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/35 text-[#25D366] hover:bg-[#25D366]/20 py-2.5 rounded-xl w-full text-xs font-black uppercase tracking-widest transition-all duration-200"
      >
        💬 WhatsApp Pe Share
      </button>
    </div>

    {/* Actions footer for logged in users */}
    <div className="p-3 border-t border-white/5 bg-white/[0.01]">
      {currentUser ? (
        <div className="grid grid-cols-2 gap-2">
          <a 
            href={`https://wa.me/${formatWhatsAppNumber(report.whatsappNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-[#25D366]/10 text-[#25D366] py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
          <a 
            href={`tel:${report.contactNumber}`}
            className="flex items-center justify-center gap-1.5 bg-teal-500/10 text-teal-400 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-teal-500/20 hover:bg-teal-500/20 transition-all"
          >
            <Phone size={13} /> Contact
          </a>
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] flex items-center justify-center p-4 text-center z-10 transition-all opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto duration-300">
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-xl pointer-events-auto max-w-[240px]">
            <Lock className="mx-auto text-amber-500 mb-2" size={20} />
            <p className="text-white text-xs font-extrabold uppercase tracking-wide mb-3 leading-relaxed">{t('feed_login_prompt')}</p>
            <button 
              onClick={signInWithGoogle}
              className="w-full bg-white hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              Unlock with Google
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Owner Options (Edit/Delete) / Flag option */}
    {currentUser && (
      <div className="p-3 border-t border-white/5 bg-slate-950/20">
        {currentUser.uid === report.userId ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onEdit(report)}
              className="flex items-center justify-center gap-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:border-teal-400 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all duration-200 w-full"
            >
              ✏️ Entry Edit Karein
            </button>
            <button
              onClick={() => onDelete(report.id)}
              className="flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-400 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all duration-200 w-full"
            >
              🗑️ Apni Entry Delete Karein
            </button>
            
            {report.status !== 'recovered' && (
              <button
                onClick={() => onRecovery(report)}
                className="flex items-center justify-center gap-1.5 bg-teal-400/10 border border-teal-400/40 text-teal-300 hover:bg-teal-400/25 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 w-full"
              >
                ✅ Mujhe Mera Phone Mil Gaya!
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onReportFake(report.id)}
            className="flex items-center justify-center gap-1.5 bg-amber-500/5 border border-amber-500/20 text-amber-500 hover:bg-amber-500/15 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 w-full"
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
  const [totalPhones, setTotalPhones] = useState(0);
  const [recoveredPhones, setRecoveredPhones] = useState(0);
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

    // Statistics fetching
    const unsubscribeTotal = onSnapshot(collection(db, 'phones'), (snap) => {
      setTotalPhones(snap.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'phones');
    });

    const unsubscribeRecovered = onSnapshot(
      query(collection(db, 'phones'), where('status', '==', 'recovered')),
      (snap) => {
        setRecoveredPhones(snap.size);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'phones');
      }
    );

    localStorage.setItem('pakimei_last_visited_feed', Date.now().toString());

    return () => {
      unsubscribe();
      unsubscribeTotal();
      unsubscribeRecovered();
    };
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

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    try {
      let date: Date;
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) return String(dateValue);
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(dateValue);
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

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 px-0 sm:px-4">
        {/* Total Registered */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-5 text-center border border-white/10 hover:border-pak-red/30 transition-all group"
        >
          <div className="font-display font-black text-3xl md:text-4xl text-pak-red group-hover:scale-110 transition-transform">
            {totalPhones}
          </div>
          <div className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-2">
            📱 Total Registered
          </div>
        </motion.div>

        {/* Recovered */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 text-center border border-pak-teal/30 hover:bg-pak-teal/5 transition-all group"
        >
          <div className="font-display font-black text-3xl md:text-4xl text-pak-teal group-hover:scale-110 transition-transform">
            {recoveredPhones}
          </div>
          <div className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-2">
            ✅ Phones Wapas Mile
          </div>
        </motion.div>

        {/* Active Reports */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 text-center border border-pak-orange/30 hover:bg-pak-orange/5 transition-all group"
        >
          <div className="font-display font-black text-3xl md:text-4xl text-pak-orange group-hover:scale-110 transition-transform">
            {totalPhones - recoveredPhones}
          </div>
          <div className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-2">
            🔍 Active Reports
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : phones.length === 0 ? (
        <div className="text-center py-20 card-glass rounded-3xl p-10 border border-white/10">
          <Smartphone size={64} className="mx-auto text-white/20 mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">{t('feed_empty')}</h3>
          <p className="text-white/40">Abhi tak koi entry nahi hui. Pehle register karne wale banein!</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
