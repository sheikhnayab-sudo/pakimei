import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Shield, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar({ user }: { user: any }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-all duration-300">
            <Shield className="text-emerald-400 w-5 h-5 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-tight text-white">IMEI GUARD</h1>
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-black">Pakistan Portal</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-bold text-slate-300 hover:text-emerald-400 transition-colors">Search IMEI</Link>
          <Link to="/report" className="text-sm font-bold text-slate-300 hover:text-emerald-400 transition-colors">Report Stolen</Link>
          {user ? (
            <>
              <Link to="/admin/dashboard" className="text-sm font-bold text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/admin/login" className="text-xs font-black px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all hover:scale-105">
              ADMIN LOGIN
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-300 bg-white/5 rounded-lg border border-white/10"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold text-white px-2 py-1"
              >
                Search IMEI
              </Link>
              <Link 
                to="/report" 
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold text-white px-2 py-1"
              >
                Report Stolen
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/admin/dashboard" 
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-bold text-emerald-400 px-2 py-1 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" /> Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                    }}
                    className="text-lg font-bold text-red-400 px-2 py-1 text-left flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/admin/login" 
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-bold text-white px-2 py-1"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
