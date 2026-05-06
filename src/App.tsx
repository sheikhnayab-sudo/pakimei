import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/HomePage';
import Register from './components/RegisterPage';
import Search from './components/SearchPage';
import HowItWorks from './components/HowItWorks';
import FeedPage from './components/FeedPage';

const App: React.FC = () => {
  useEffect(() => {
    console.log('Firebase Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
    
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init(publicKey);
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen selection:bg-pak-teal/30 selection:text-pak-teal">
            {/* Background Blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#2ec4b6',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#e63946',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          <Header />
          <main className="mx-auto max-w-7xl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<Search />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/feed" element={<FeedPage />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  </AuthProvider>
);
};

export default App;
