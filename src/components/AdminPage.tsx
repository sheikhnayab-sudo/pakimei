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
  Timestamp 
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
  LayoutGrid
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'flagged' | 'pending'>('all');

  useEffect(() => {
    // Only subscribe to onSnapshot if the current user is the admin
    if (currentUser?.email !== 'sheikhnayab@gmail.com') {
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
      console.error("Admin data fetch error:", error);
      toast.error("Failed to load admin data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ACCESS CONTROL
  if (!currentUser || currentUser.email !== 'sheikhnayab@gmail.com') {
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
      toast.error('Update failed. Check permissions.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('🚨 PERMANENT DELETE: Are you sure? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'phones', id));
      toast.success('Entry deleted permanently 🗑️');
    } catch (err) {
      console.error("Delete error:", err);
      toast.error('Deletion failed.');
    }
  };

  // Stats calculation
  const stats = {
    total: entries.length,
    verified: entries.filter(e => e.status === 'verified').length,
    flagged: entries.filter(e => e.status === 'flagged').length,
    today: entries.filter(e => {
      const created = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
      return new Date(created).toDateString() === new Date().toDateString();
    }).length
  };

  // Filtered entries
  const filteredEntries = entries.filter(entry => {
    const matchSearch = 
      entry.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.brand + ' ' + entry.model).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTab = activeTab === 'all' || entry.status === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tighter outline-glow">
              Admin <span className="text-pak-teal">Panel</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Security & Registry Management</p>
          </motion.div>
          
          <div className="glass rounded-2xl flex items-center p-1 px-4 border border-white/10 w-full md:w-96 group focus-within:border-pak-teal/50 transition-all">
            <Search className="text-white/20 group-focus-within:text-pak-teal transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search IMEI, Owner, Model..."
              className="bg-transparent border-none text-white p-3 w-full outline-none text-sm font-medium placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard title="Total Registry" value={stats.total} icon={<LayoutGrid />} color="text-white" delay={0} />
          <StatCard title="Verified Data" value={stats.verified} icon={<CheckCircle2 />} color="text-pak-teal" delay={0.1} />
          <StatCard title="Flagged (Hidden)" value={stats.flagged} icon={<AlertTriangle />} color="text-pak-red" delay={0.2} />
          <StatCard title="Today's Entries" value={stats.today} icon={<TrendingUp />} color="text-pak-orange" delay={0.3} />
        </div>

        {/* CONTROLS */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {(['all', 'pending', 'verified', 'flagged'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                activeTab === tab 
                  ? 'bg-pak-teal text-navy-900 border-pak-teal shadow-lg shadow-pak-teal/20' 
                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* DATA TABLE */}
        <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30">Owner & Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30">Phone & IMEI</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30 text-center">Visual Verification</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-pak-teal mb-4" size={32} />
                      <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Loading Database...</p>
                    </td>
                  </tr>
                ) : filteredEntries.map((entry, idx) => (
                  <motion.tr 
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="font-bold text-white text-lg tracking-tight mb-1">{entry.ownerName}</div>
                      <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
                        <Calendar size={12} className="text-pak-teal" />
                        {entry.createdAt?.toDate 
                          ? entry.createdAt.toDate().toLocaleDateString('en-GB') 
                          : new Date(entry.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-white mb-1 uppercase tracking-tighter">{entry.brand} {entry.model}</div>
                      <div className="text-pak-teal font-mono text-xs font-bold bg-pak-teal/5 px-2 py-0.5 rounded w-fit">{entry.imei}</div>
                      <div className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
                        <MapPin size={10} /> {entry.city}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-4">
                        <Thumbnail label="Selfie" src={entry.selfieImageUrl} circular />
                        <Thumbnail label="Proof" src={entry.proofImageUrl} />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        entry.status === 'verified' ? 'bg-pak-teal/20 text-pak-teal border-pak-teal/30' :
                        entry.status === 'flagged' ? 'bg-pak-red/20 text-pak-red border-pak-red/30' :
                        'bg-pak-orange/20 text-pak-orange border-pak-orange/30'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status !== 'verified' && (
                          <ActionButton 
                            onClick={() => handleStatusUpdate(entry.id, 'verified')}
                            icon={<CheckCircle2 size={16} />}
                            color="text-pak-teal"
                            bg="bg-pak-teal/10 hover:bg-pak-teal"
                            title="Verify Entry"
                          />
                        )}
                        {entry.status !== 'flagged' && (
                          <ActionButton 
                            onClick={() => handleStatusUpdate(entry.id, 'flagged')}
                            icon={<AlertTriangle size={16} />}
                            color="text-pak-red"
                            bg="bg-pak-red/10 hover:bg-pak-red"
                            title="Flag Entry"
                          />
                        )}
                        <ActionButton 
                          onClick={() => handleDelete(entry.id)}
                          icon={<Trash2 size={16} />}
                          color="text-white/40"
                          bg="bg-white/5 hover:bg-white hover:text-black"
                          title="Delete Permanently"
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {!loading && filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <p className="text-white/20 italic font-medium">No reports found matching your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden"
  >
    <div className={`p-4 rounded-2xl bg-white/5 w-fit mb-6 ${color} border border-white/5`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div className="text-4xl font-black text-white mb-2 tracking-tighter">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{title}</div>
    {/* Subtle design accent */}
    <div className="absolute -right-4 -bottom-4 text-white/[0.02] rotate-12">
      {React.cloneElement(icon, { size: 120 })}
    </div>
  </motion.div>
);

const Thumbnail = ({ label, src, circular }: any) => {
  const isLoading = !src || src === 'uploading';
  
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <div className={`w-12 h-12 ${circular ? 'rounded-full' : 'rounded-xl'} overflow-hidden border-2 border-white/10 bg-white/5 transition-all group-hover:border-pak-teal shadow-lg`}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-white/20" size={14} />
          </div>
        ) : (
          <a href={src} target="_blank" rel="noreferrer">
            <img src={src} alt={label} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          </a>
        )}
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-pak-teal transition-colors">
        {label}
      </span>
    </div>
  );
};

const ActionButton = ({ onClick, icon, color, bg, title }: any) => (
  <button 
    onClick={onClick}
    title={title}
    className={`p-3 rounded-xl transition-all active:scale-90 ${bg} ${color} group`}
  >
    <div className="transition-transform group-hover:scale-110">
      {icon}
    </div>
  </button>
);

export default AdminPage;
