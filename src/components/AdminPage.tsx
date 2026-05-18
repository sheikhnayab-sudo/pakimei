import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  Timestamp,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Search, 
  Calendar, 
  MapPin, 
  Loader2,
  TrendingUp,
  LayoutGrid,
  Download,
  Eye,
  ExternalLink,
  MessageCircle,
  Phone,
  Hash,
  Smartphone,
  User,
  Clock,
  ShieldCheck,
  FileText,
  RotateCcw,
  Edit,
  X,
  Save,
  Trash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatWhatsAppNumber } from '../constants';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const adminEmail = 'sheikhnayab@gmail.com';
  const isAdminUser = currentUser?.email?.toLowerCase() === adminEmail;
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'flagged' | 'pending'>('all');
  const [editingEntry, setEditingEntry] = useState<any | null>(null);

  useEffect(() => {
    if (!isAdminUser) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'phones'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'phones');
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, activeTab, isAdminUser]);

  if (!currentUser || !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-12 rounded-3xl text-center max-w-md">
          <AlertTriangle className="mx-auto text-pak-red mb-6" size={64} />
          <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Access Denied</h1>
          <p className="text-white/50 mb-8 font-medium leading-relaxed">This page is restricted to authorized administrative personnel only.</p>
          <a href="/" className="btn-glass-primary inline-block px-10 py-4 rounded-2xl uppercase font-black tracking-widest text-xs">Return Home</a>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'phones', id), {
        status: newStatus,
        verified: newStatus === 'verified'
      });
      toast.success(`Entry marked as ${newStatus} ✅`);
    } catch (err) {
      console.error("Update error:", err);
      toast.error('Update failed.');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      // Check if admin
      if (currentUser?.email?.toLowerCase() !== 'sheikhnayab@gmail.com') {
        toast.error('Sirf admin delete kar sakta hai!');
        return;
      }

      // Confirm before delete
      const confirmed = window.confirm(
        'Kya aap sure hain? Ye entry permanently delete ho jaye gi.'
      );
      if (!confirmed) return;

      const t = toast.loading("Delete ho raha hai...");

      // Delete from Firestore
      await deleteDoc(doc(db, 'phones', entryId));
      
      // Remove from local state immediately
      setEntries(prev => prev.filter(e => e.id !== entryId));
      
      toast.success('Entry delete ho gayi! ✅', { id: t });
      
    } catch (err: any) {
      console.error('Delete error:', err.code, err.message);
      toast.error('Delete nahi hua: ' + err.message);
    }
  };

  const handleEditSave = async (updatedData: any) => {
    const t = toast.loading("Saving changes...");
    try {
      const { id, ...data } = updatedData;
      await updateDoc(doc(db, 'phones', id), data);
      toast.success('Entry updated successfully 💾', { id: t });
      setEditingEntry(null);
    } catch (err) {
      console.error("Edit error:", err);
      toast.error('Failed to save changes.', { id: t });
    }
  };

  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    verified: entries.filter(e => e.status === 'verified').length,
    flagged: entries.filter(e => e.status === 'flagged').length,
  };

  const filteredEntries = entries.filter(entry => {
    const searchString = searchTerm.toLowerCase();
    const matchSearch = 
      (entry.imei || '').toLowerCase().includes(searchString) ||
      (entry.ownerName || '').toLowerCase().includes(searchString) ||
      (entry.city || '').toLowerCase().includes(searchString) ||
      (entry.nicNumber || '').toLowerCase().includes(searchString) ||
      (entry.brand + ' ' + (entry.model || '')).toLowerCase().includes(searchString);
    
    const matchTab = activeTab === 'all' || entry.status === activeTab;
    return matchSearch && matchTab;
  });

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="bg-pak-teal/20 p-2 rounded-xl border border-pak-teal/30">
                <ShieldCheck size={24} className="text-pak-teal" />
              </div>
              <span className="text-pak-teal font-black uppercase tracking-[0.3em] text-xs">Admin Control Center</span>
            </motion.div>
            <h1 className="font-display text-5xl sm:text-6xl font-black text-white tracking-tighter">
              Manage <span className="text-pak-teal">Registry</span>
            </h1>
          </div>
          
          <div className="glass rounded-[2rem] flex items-center p-2 px-6 border border-white/10 w-full md:w-[400px] shadow-2xl focus-within:border-pak-teal/50 focus-within:ring-4 focus-within:ring-pak-teal/10 transition-all">
            <Search className="text-white/20" size={24} />
            <input 
              type="text"
              placeholder="IMEI, Name, CNIC, or City..."
              className="bg-transparent border-none text-white p-4 w-full outline-none text-base font-bold placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total} icon={<LayoutGrid />} color="text-white" bg="bg-white/5" delay={0} />
          <StatCard title="Pending" value={stats.pending} icon={<Clock />} color="text-pak-orange" bg="bg-pak-orange/10" delay={0.1} />
          <StatCard title="Verified" value={stats.verified} icon={<CheckCircle2 />} color="text-pak-teal" bg="bg-pak-teal/10" delay={0.2} />
          <StatCard title="Flagged" value={stats.flagged} icon={<AlertTriangle />} color="text-pak-red" bg="bg-pak-red/10" delay={0.3} />
        </div>

        {/* TABS CONTROLS */}
        <div className="flex gap-3 overflow-x-auto pb-4 sticky top-24 z-20 scrollbar-hide py-2 backdrop-blur-md bg-black/50 mx-[-1rem] px-4">
          {(['all', 'pending', 'verified', 'flagged'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all border shrink-0 flex items-center gap-2 ${
                activeTab === tab 
                  ? 'bg-pak-teal text-navy-900 border-pak-teal shadow-xl shadow-pak-teal/30 scale-105' 
                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                tab === 'verified' ? 'bg-pak-teal' : 
                tab === 'flagged' ? 'bg-pak-red' : 
                tab === 'pending' ? 'bg-pak-orange' : 'bg-white/40'
              }`} />
              {tab} ({stats[tab]})
            </button>
          ))}
        </div>

        {/* DETAILED LISTING */}
        <div className="space-y-8">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center glass rounded-[3rem]">
              <Loader2 className="animate-spin text-pak-teal mb-6" size={64} />
              <p className="text-white/40 font-black uppercase tracking-[0.3em] text-sm animate-pulse">Scanning Decrypted Data Vault...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-32 text-center glass rounded-[3rem] border border-white/5">
              <p className="text-white/20 text-xl font-bold italic tracking-tight">No results matched your high-level search...</p>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <AdminEntryCard 
                key={entry.id} 
                entry={entry} 
                idx={idx} 
                onStatusUpdate={handleStatusUpdate}
                onDelete={() => handleDelete(entry.id)}
                onEdit={() => setEditingEntry(entry)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingEntry && (
          <EditModal 
            entry={editingEntry} 
            onClose={() => setEditingEntry(null)} 
            onSave={handleEditSave} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const EditModal = ({ entry, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({ ...entry });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass rounded-[2rem] w-full max-w-2xl border border-white/10 relative z-10 overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Edit className="text-pak-teal" /> Edit Registry Entry
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <InputGroup label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleChange} />
            <InputGroup label="CNIC Number" name="nicNumber" value={formData.nicNumber} onChange={handleChange} />
            <InputGroup label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
            <InputGroup label="WhatsApp Number" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} />
            <InputGroup label="Brand" name="brand" value={formData.brand} onChange={handleChange} />
            <InputGroup label="Model" name="model" value={formData.model} onChange={handleChange} />
            <InputGroup label="IMEI Number" name="imei" value={formData.imei} onChange={handleChange} />
            <InputGroup label="Color" name="color" value={formData.color} onChange={handleChange} />
            <InputGroup label="City" name="city" value={formData.city} onChange={handleChange} />
            <InputGroup label="Loss Location" name="lossLocation" value={formData.lossLocation} onChange={handleChange} />
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1.5 block">Report Type</label>
              <select 
                name="reportType" 
                value={formData.reportType} 
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal outline-none transition-all"
              >
                <option value="stolen">Stolen</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1.5 block">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pak-teal outline-none transition-all"
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1.5 block">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-sm text-white focus:border-pak-teal outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5 flex gap-4">
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 bg-pak-teal text-navy-900 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-pak-teal/20"
          >
            <Save size={20} /> Save Changes
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-4 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-sm hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const InputGroup = ({ label, name, value, onChange }: any) => (
  <div>
    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1.5 block">{label}</label>
    <input 
      type="text" 
      name={name} 
      value={value} 
      onChange={onChange}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-pak-teal outline-none transition-all"
    />
  </div>
);

const AdminEntryCard = ({ entry, idx, onStatusUpdate, onDelete, onEdit, formatDate }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`glass rounded-[2.5rem] border overflow-hidden transition-all hover:shadow-2xl hover:shadow-pak-teal/5 ${
        entry.status === 'verified' ? 'border-pak-teal/30 shadow-pak-teal/5' : 
        entry.status === 'flagged' ? 'border-pak-red/30' : 'border-white/10'
      }`}
    >
      {/* CARD HEADER */}
      <div className={`px-8 py-5 flex items-center justify-between border-b border-white/5 ${
        entry.status === 'verified' ? 'bg-pak-teal/5' : 
        entry.status === 'flagged' ? 'bg-pak-red/5' : 'bg-white/5'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
            entry.reportType === 'stolen' ? 'bg-pak-red/20 text-pak-red' : 'bg-pak-teal/20 text-pak-teal'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${entry.reportType === 'stolen' ? 'bg-pak-red' : 'bg-pak-teal'}`} />
            {entry.reportType === 'stolen' ? '🚨 STOLEN Report' : '⚠️ LOST Report'}
          </div>
          <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Registry ID: #{entry.id.slice(0,8).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/40 text-[11px] font-bold">
            <Calendar size={14} className="text-pak-teal" />
            Registered: {formatDate(entry.createdAt)}
          </div>
          <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
            entry.status === 'verified' ? 'bg-pak-teal text-navy-900 border-pak-teal' :
            entry.status === 'flagged' ? 'bg-pak-red text-white border-pak-red' :
            'bg-pak-orange text-navy-900 border-pak-orange'
          }`}>
            {entry.status}
          </div>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="p-8">
        {/* Profile Section */}
        {entry.selfieImageUrl && entry.selfieImageUrl !== 'uploading' && (
          <div className="flex items-center gap-4 mb-8 p-3 bg-white/5 rounded-2xl border border-white/10 w-fit pr-8">
            <img
              src={entry.selfieImageUrl + '?w=200&q=auto&f=auto'}
              loading="lazy"
              alt="Owner"
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(46,196,182,0.6)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                flexShrink: 0,
              }}
            />
            <div>
              <div className="font-display font-bold text-white text-xl">
                {entry.ownerName}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-widest mt-1">
                📍 {entry.city}
              </div>
              <div className="text-xs text-white/40 uppercase tracking-widest mt-1">
                🕐 {formatDate(entry.createdAt)}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 opacity-100">
        <div className="contents">
          {/* LEFT: OWNER INFO */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3 text-pak-teal mb-2">
              <User size={18} />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Owner Information</h4>
            </div>
            <div className="space-y-4">
              <InfoRow label="Full Name" value={entry.ownerName} bold />
              <InfoRow label="CNIC Number" value={entry.nicNumber || 'Not Provided'} icon={<Hash size={14}/>} />
              <InfoRow label="Contact No." value={entry.contactNumber} icon={<Phone size={14}/>} link={`tel:${entry.contactNumber}`} />
              <InfoRow 
                label="WhatsApp No." 
                value={entry.whatsappNumber} 
                icon={<MessageCircle size={14} className="text-[#25D366]"/>} 
                link={`https://wa.me/${formatWhatsAppNumber(entry.whatsappNumber)}`}
                linkText="Open Chat"
              />
              <InfoRow label="City & Area" value={`${entry.city}`} icon={<MapPin size={14}/>} />
            </div>
          </div>

          {/* MIDDLE: DEVICE INFO */}
          <div className="lg:col-span-4 space-y-6 border-x border-white/5 px-0 lg:px-10">
            <div className="flex items-center gap-3 text-pak-teal mb-2">
              <Smartphone size={18} />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Device Details</h4>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Make & Model</div>
                <div className="text-2xl font-black text-white tracking-tighter uppercase">{entry.brand} {entry.model}</div>
                <div className="text-pak-teal text-xs font-bold mt-1 uppercase tracking-widest">{entry.color || 'No Color Specified'}</div>
              </div>
              <InfoRow label="IMEI Number" value={entry.imei} highlight />
              <InfoRow label="Loss Location" value={entry.lossLocation} />
              <InfoRow label="Loss Date/Time" value={formatDate(entry.lossDateTime)} />
            </div>
          </div>

          {/* RIGHT: VISUAL VERIFICATION */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3 text-pak-teal mb-2">
              <Eye size={18} />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Visual Evidence</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <MediaBlock label="ID/Box Proof" src={entry.proofImageUrl} />
            </div>
            {entry.description && (
              <div className="pt-4 border-t border-white/5">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Detailed Narrative</div>
                <p className="text-xs text-white/60 leading-relaxed italic line-clamp-3">"{entry.description}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* CARD ACTIONS */}
      <div className="px-8 py-6 bg-white/[0.03] border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Admin Actions:</span>
          <div className="flex items-center gap-3">
            <ActionButton 
              label="Verify" 
              icon={<CheckCircle2 size={18}/>} 
              active={entry.status === 'verified'}
              color="text-pak-teal" 
              bg="bg-pak-teal/10 hover:bg-pak-teal hover:text-navy-900"
              onClick={() => onStatusUpdate(entry.id, 'verified')}
            />
            <ActionButton 
              label="Flag" 
              icon={<AlertTriangle size={18}/>} 
              active={entry.status === 'flagged'}
              color="text-pak-orange" 
              bg="bg-pak-orange/10 hover:bg-pak-orange hover:text-navy-900"
              onClick={() => onStatusUpdate(entry.id, 'flagged')}
            />
            <ActionButton 
              label="Edit Details" 
              icon={<Edit size={18}/>} 
              active={false}
              color="text-white" 
              bg="bg-white/10 hover:bg-white hover:text-black"
              onClick={onEdit}
            />
          </div>
        </div>
        
        <button 
          onClick={onDelete}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-pak-red/10 text-pak-red hover:bg-pak-red hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-pak-red/20"
        >
          <Trash2 size={18} />
          Delete Permanently
        </button>
      </div>
    </motion.div>
  );
};

const InfoRow = ({ label, value, icon, link, linkText, bold, highlight }: any) => (
  <div className="group flex flex-col">
    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/30 truncate">{label}</span>
    <div className="flex items-center gap-3 mt-0.5">
      {icon && <span className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>}
      <span className={`${bold ? 'font-black text-lg' : 'font-bold'} ${highlight ? 'text-pak-teal font-mono bg-pak-teal/5 px-2 py-0.5 rounded border border-pak-teal/20' : 'text-white'}`}>
        {value || '---'}
      </span>
      {link && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-1.5 rounded-lg bg-white/5 hover:bg-pak-teal/20 text-pak-teal transition-all flex items-center gap-1.5"
        >
          <ExternalLink size={12} />
          {linkText && <span className="text-[9px] font-black uppercase tracking-widest">{linkText}</span>}
        </a>
      )}
    </div>
  </div>
);

const MediaBlock = ({ label, src, circular }: any) => {
  const isMissing = !src || src === 'uploading' || src === '';
  
  return (
    <div className="space-y-3">
      <div className={`relative aspect-square w-full rounded-2xl border-2 border-white/5 bg-white/5 overflow-hidden group/img ${circular ? 'rounded-full' : ''}`}>
        {isMissing ? (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-20 text-center p-4">
            <Smartphone size={32} />
            <span className="text-[9px] font-bold uppercase mt-2">No Image</span>
          </div>
        ) : (
          <>
            <img 
              src={src + (circular ? '?w=400&q=auto' : '?w=800&q=auto')} 
              alt={label} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" 
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <a href={src} target="_blank" rel="noreferrer" className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                <Eye size={20} />
              </a>
            </div>
          </>
        )}
      </div>
      <div className="text-center space-y-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</span>
        {!isMissing && (
          <div className="flex flex-col gap-2">
            <a 
              href={src} 
              target="_blank" 
              rel="noreferrer" 
              className="bg-pak-teal/10 border border-pak-teal/20 text-pak-teal px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-pak-teal hover:text-navy-900 transition-all flex items-center justify-center gap-2"
            >
              <Download size={12} /> Download Photo
            </a>
            <a 
              href={src} 
              target="_blank" 
              rel="noreferrer" 
              className="text-white/40 text-[8px] font-bold uppercase hover:text-white transition-all underline underline-offset-4"
            >
              Full Size View
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, bg, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className={`p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group ${bg}`}
  >
    <div className={`p-4 rounded-2xl w-fit mb-4 ${color} border border-white/5 bg-black/20 group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div className="text-4xl font-black text-white mb-1 tracking-tighter tabular-nums">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{title}</div>
    {/* Background Pattern */}
    <div className="absolute -right-4 -bottom-4 text-white/[0.03] rotate-12 transition-transform group-hover:rotate-0 duration-700">
      {React.cloneElement(icon, { size: 100 })}
    </div>
  </motion.div>
);

const ActionButton = ({ label, icon, active, color, bg, onClick }: any) => (
  <button 
    onClick={onClick}
    disabled={active}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.15em] border ${
      active ? 'bg-white/10 text-white/30 border-white/10 cursor-not-allowed scale-95' : `border-transparent ${bg} ${color}`
    }`}
  >
    {icon}
    {label}
  </button>
);

export default AdminPage;
