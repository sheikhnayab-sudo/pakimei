import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';

// Lazy loading page components
const HomePage = lazy(() => import('./components/HomePage'));
const RegisterPage = lazy(() => import('./components/RegisterPage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const HowItWorks = lazy(() => import('./components/HowItWorks'));
const FeedPage = lazy(() => import('./components/FeedPage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const AboutUs = lazy(() => import('./components/AboutUs'));

const App: React.FC = () => {
  useEffect(() => {
    console.log('Firebase Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
    
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init(publicKey);
    }
  }, []);

  const LoadingFallback = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      color: 'rgba(255,255,255,0.5)',
      fontSize: '1rem',
      fontFamily: "'Outfit', sans-serif"
    }}>
      ⏳ Loading...
    </div>
  );

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
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/about" element={<AboutUs />} />
              </Routes>
            </Suspense>
          </main>
          
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  </AuthProvider>
);
};

export default App;
