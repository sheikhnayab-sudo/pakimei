import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon, AlertTriangle, CheckCircle2, ShieldAlert, Smartphone, ArrowLeft, Loader2, MapPin, Lock, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const RestrictedResultCard: React.FC<{ result: any; onLogin: () => void }> = ({ result, onLogin }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const maskIMEI = (imei: string) => {
    if (!imei) return "●●●●●●●●●●●●●●●";
    const firstTwo = imei.substring(0, 2);
    const lastTwo = imei.substring(imei.length - 2);
    return `${firstTwo}●●●●●●●●●●●${lastTwo}`;
  };

  return (
    <div className="rounded-3xl border-2 border-pak-red bg-pak-red/10 p-2 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
          <div className="flex items-center gap-4 text-pak-red">
            <ShieldAlert size={64} />
            <div>
              <h3 className="font-display text-3xl font-black uppercase italic tracking-tighter leading-none">🚨 ALERT — YEH PHONE REPORTED HAI!</h3>
              <p className="font-bold opacity-80 text-sm mt-1">This Device has been flagged in our database</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="glass rounded-2xl p-7 border border-white/20">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Device Info</span>
            <div className="mt-5 flex items-center gap-5">
              <div className="rounded-2xl bg-pak-teal/20 p-4 text-pak-teal border border-pak-teal/20">
                <Smartphone size={28} />
              </div>
              <div>
                <p className="text-2xl font-black text-white capitalize leading-none mb-2">{result.brand}</p>
                <p className="text-lg font-black text-white/20 blurred leading-none mb-2">Model Name Hidden</p>
                <p className="text-sm font-mono text-white/50 tracking-widest">{maskIMEI(result.imei)}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-7 border border-white/20">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Reporting City</span>
            <div className="mt-5 flex items-center gap-5">
              <div className="rounded-2xl bg-pak-red/20 p-4 text-pak-red border border-pak-red/20">
                <MapPin size={28} />
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-none mb-2">{result.city || 'City Hidden'}</p>
                <p className="text-lg font-black text-white/20 blurred leading-none mb-2">Location Blur Area</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Prompt Overlay */}
        <div className="mt-8 relative z-20">
          <div className="glass rounded-3xl border border-white/20 p-8 text-center shadow-2xl relative overflow-hidden bg-black/40 backdrop-blur-md">
            <div className="absolute inset-0 bg-pak-orange/5 pointer-events-none"></div>
            <Lock className="mx-auto text-pak-orange mb-4 shadow-orange-500/50 drop-shadow-lg" size={40} />
            <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              🔒 PURI DETAILS DEKHNE KE LIYE ACCOUNT BANANA ZARORI HAI
            </h4>
            <p className="text-white/60 mb-8 max-w-sm mx-auto font-medium">
              Information aur contact details mehdood hain. Bilkul muft account banayein aur full access hasil karein.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Google se Login Karein
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-10 py-4 glass text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={18} /> Account Banayein
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Search: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, login } = useAuth();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [imei, setImei] = useState(queryParam);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (queryParam) {
      handleSearch(queryParam);
    }
  }, [queryParam]);

  const handleSearch = async (imeiToSearch: string) => {
    if (imeiToSearch.length < 14) return;
    setLoading(true);
    setSearched(true);
    try {
      // Search for any record with this IMEI
      const phonesPath = 'phones';
      const q = query(collection(db, phonesPath), where('imei', '==', imeiToSearch));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        // Hide flagged entries from public search
        if (data.status === 'flagged') {
          setResult(null);
        } else {
          setResult(data);
        }
      } else {
        setResult(null);
      }
    } catch (error: any) {
      if (error?.message?.includes('offline')) {
        toast.error(t('reg_error_offline'));
      } else {
        handleFirestoreError(error, OperationType.LIST, 'phones');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/" className="mb-8 flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors">
        <ArrowLeft size={18} /> {t('search_back')}
      </Link>

      <div className="mb-12">
        <h2 className="font-display text-5xl font-black text-white mb-8 uppercase tracking-tighter italic drop-shadow-lg">{t('search_result_title')}</h2>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-white/30">
            <SearchIcon size={24} />
          </div>
          <input
            type="text"
            maxLength={15}
            value={imei}
            onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(imei)}
            placeholder={t('search_placeholder')}
            className="glass-input block w-full rounded-2xl py-7 pl-14 pr-44 text-2xl font-bold placeholder:text-white/20"
          />
          <button
            onClick={() => handleSearch(imei)}
            className="btn-glass-primary absolute right-3 top-3 bottom-3 rounded-xl px-10 font-black text-white text-xs uppercase tracking-widest"
          >
            {t('nav_search')}
          </button>
        </div>
      </div>

      <motion.div
        key={imei + searched}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[400px]"
      >
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 w-full animate-pulse rounded-3xl glass" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="h-32 w-full animate-pulse rounded-2xl glass" />
              <div className="h-32 w-full animate-pulse rounded-2xl glass" />
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="animate-spin text-pak-teal" size={40} />
              <p className="text-white/40 font-black tracking-widest uppercase text-xs animate-pulse">{t('search_scanning')}</p>
            </div>
          </div>
        ) : searched ? (
          result ? (
            currentUser ? (
              <div className={`rounded-3xl border-2 p-8 shadow-2xl backdrop-blur-xl ${
                result.status === 'verified' 
                  ? 'border-pak-red bg-pak-red/10 shadow-pak-red/20' 
                  : 'border-pak-teal bg-pak-teal/10 shadow-pak-teal/20'
              }`}>
                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className={`flex items-center gap-4 ${result.status === 'verified' ? 'text-pak-red' : 'text-pak-teal'}`}>
                    <ShieldAlert size={64} />
                    <div>
                      <h3 className="font-display text-3xl font-black uppercase italic tracking-tighter leading-none">{t('search_status_stolen')}</h3>
                      <p className="font-bold opacity-80 text-sm mt-1">
                        {t('search_reported_on')} {new Date(result.lossDateTime || result.dateStolen).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest border ${
                    result.status === 'verified' 
                      ? 'bg-pak-red text-white border-pak-red' 
                      : 'bg-transparent text-pak-teal border-pak-teal/30'
                  }`}>
                    {result.status.toUpperCase()} STATUS
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-7 border border-white/20">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{t('search_device_info')}</span>
                    <div className="mt-5 flex items-center gap-5">
                      <div className="rounded-2xl bg-pak-teal/20 p-4 text-pak-teal border border-pak-teal/20 shadow-lg shadow-pak-teal/10">
                        <Smartphone size={28} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white capitalize leading-none mb-2">{result.brand} {result.model}</p>
                        <p className="text-sm font-mono text-white/50 tracking-widest">{result.imei}</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-7 border border-white/20">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{t('search_last_location')}</span>
                    <div className="mt-5 flex items-center gap-5">
                      <div className="rounded-2xl bg-pak-red/20 p-4 text-pak-red border border-pak-red/20 shadow-lg shadow-pak-red/10">
                        <MapPin size={28} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white leading-none mb-2">{result.lossLocation || result.location}</p>
                        <p className="text-xs text-white/50 uppercase font-black tracking-widest">Report Ref: {result.imei.slice(-6)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                   <a 
                    href={`https://wa.me/${result.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
                  >
                    Contact via WhatsApp
                  </a>
                  <div className="flex-1 flex items-center justify-center gap-3 glass text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm">
                    Owner: {result.ownerName}
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-white/5 p-8 text-base leading-relaxed text-white/70 border border-white/10 backdrop-blur-md">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="flex-shrink-0 text-pak-red drop-shadow-lg" size={28} />
                    <p className="font-semibold italic">
                      {t('search_warning_tech')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <RestrictedResultCard result={result} onLogin={login} />
            )
          ) : (
            <div className="glass rounded-3xl border-2 border-pak-teal bg-pak-teal/10 p-10 shadow-2xl shadow-pak-teal/20 overflow-hidden relative">
               {/* Background pattern */}
              <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm">
                <CheckCircle2 size={300} />
              </div>
              
              <div className="flex items-center gap-6 text-pak-teal relative z-10 drop-shadow-lg">
                <CheckCircle2 size={80} />
                <div>
                  <h3 className="font-display text-4xl font-black uppercase italic tracking-tighter leading-none">{t('search_status_clear')}</h3>
                  <p className="font-bold text-pak-teal/90 text-lg mt-2">{t('search_clear_msg')}</p>
                </div>
              </div>
              
              <div className="mt-12 flex flex-col items-center gap-8 py-16 text-center relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-pak-teal/30 blur-[100px] rounded-full"></div>
                  <div className="rounded-full glass border-4 border-white/20 p-10 text-pak-teal relative shadow-2xl">
                    <Smartphone size={80} />
                  </div>
                </div>
                <div className="max-w-md">
                   <p className="text-white/40 text-sm font-black uppercase tracking-widest mb-3">Authenticated Device Verification</p>
                   <p className="text-white text-3xl font-mono tracking-widest font-black italic drop-shadow-xl">{imei}</p>
                   <div className="mt-8 flex items-center justify-center gap-3 text-pak-teal text-sm font-black bg-pak-teal/20 px-8 py-3 rounded-full border border-pak-teal/30 shadow-lg shadow-pak-teal/10">
                     <ShieldAlert size={18} /> NO MATCHING THEFT RECORDS
                   </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Smartphone size={80} className="text-white/5 mb-6" />
            <p className="text-pak-muted font-bold uppercase tracking-[0.2em] text-xs max-w-xs">{t('search_empty_msg')}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Search;
