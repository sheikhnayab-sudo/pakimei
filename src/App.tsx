import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { sendErrorAlertEmail } from './services/emailService';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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

    // Global Error and Rejection Monitor
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes('ResizeObserver') || 
        event.message?.includes('Extension') ||
        event.message?.includes('scrolling element')
      ) {
        return; // Filter out system/extension noise
      }
      sendErrorAlertEmail({
        errorType: 'Unhandled Browser Exception',
        errorMessage: event.message || 'Unknown Javascript error',
        errorStack: event.error?.stack || 'N/A',
        additionalContext: `Page URL: ${window.location.href}\nUserAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      let msg = 'Unhandled Promise Rejection';
      let stack = 'N/A';
      if (reason instanceof Error) {
        msg = reason.message;
        stack = reason.stack || 'N/A';
      } else if (reason) {
        msg = typeof reason === 'object' ? JSON.stringify(reason) : String(reason);
      }
      
      // Ignore routine connection/auth cancel noise
      if (
        msg.includes('user-cancelled') || 
        msg.includes('auth/popup-closed-by-user') || 
        msg.includes('network-error')
      ) {
        return;
      }

      sendErrorAlertEmail({
        errorType: 'Unhandled Promise Rejection',
        errorMessage: msg,
        errorStack: stack,
        additionalContext: `Page URL: ${window.location.href}\nUserAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
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
    <ThemeProvider>
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
  </ThemeProvider>
);
};

export default App;
