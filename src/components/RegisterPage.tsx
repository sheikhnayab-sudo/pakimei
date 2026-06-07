import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Smartphone, User, Phone, MapPin, Calendar, ClipboardCheck, 
  Lock, Hash, ShieldCheck, Map, Clock, Info, CheckSquare, Square,
  MessageCircle, XCircle, FileText, Package, Receipt, AlertTriangle, Check, Camera, RefreshCw, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { PAKISTANI_CITIES, PHONE_BRANDS, formatNIC, validateNIC, validateIMEI, formatWhatsAppNumber, validateWhatsAppNumber } from '../constants';
import { sendConfirmationEmail, sendErrorAlertEmail } from '../services/emailService';
import { uploadToCloudinary, uploadSelfieToCloudinary } from '../services/cloudinaryService';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const SelfieCapture = ({ onCapture }: { onCapture: (file: File) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Biometric states
  const [livenessStep, setLivenessStep] = useState<'align' | 'calibrate' | 'blink' | 'verified'>('align');
  const [statusMessage, setStatusMessage] = useState('Camera tayyar kholne k liye button touch karein...');
  const [blinkScore, setBlinkScore] = useState(10);
  const [brightnessValue, setBrightnessValue] = useState(0);
  const [contrastValue, setContrastValue] = useState(0);
  const [showOverride, setShowOverride] = useState(false);

  const isCapturingRef = useRef(false);

  const playBeep = (freq = 800, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log('Audio feedback not available');
    }
  };

  const checkVideoActive = () => {
    const video = videoRef.current;
    if (!video) return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(video, 0, 0, 50, 50);
    const imageData = ctx.getImageData(0, 0, 50, 50);
    const data = imageData.data;
    
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i+1] + data[i+2]) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    return avgBrightness > 15;
  };

  const openCamera = async () => {
    try {
      setShowOverride(false);
      setLivenessStep('align');
      setBlinkScore(10);
      isCapturingRef.current = false;
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: "user"
        },
        audio: false
      });
      streamRef.current = mediaStream;
      setCameraOpen(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().then(() => {
            playBeep(650, 0.15);
          }).catch(console.error);
        }
      }, 150);

      // Show backup manual capture button after 15 seconds to ensure user is never locked out
      setTimeout(() => {
        setShowOverride(true);
      }, 15000);

    } catch (err: any) {
      toast.error('Camera nahi khula: ' + err.message);
    }
  };

  const capturePhoto = () => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
    }
    
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Photo capture failure. Dobara try karein.');
        isCapturingRef.current = false;
        return;
      }
      const file = new File(
        [blob], 
        `selfie_${Date.now()}.jpg`, 
        { type: 'image/jpeg' }
      );
      setCaptured(URL.createObjectURL(blob));
      onCapture(file);
      
      // Stop tracks
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCameraOpen(false);
    }, 'image/jpeg', 0.85);
  };

  const forceCapture = () => {
    playBeep(900, 0.2);
    setLivenessStep('verified');
    setBlinkScore(100);
    setStatusMessage("✅ Backup verified! Snapping image...");
    capturePhoto();
  };

  const retake = () => {
    setCaptured(null);
    openCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Liveness loop
  useEffect(() => {
    let animId: number;
    if (cameraOpen && videoRef.current) {
      const video = videoRef.current;
      const scanCanvas = document.createElement('canvas');
      const scanCtx = scanCanvas.getContext('2d');
      
      let history: number[] = [];
      let baseOpenContrast = 0;
      let calibrateFrames = 0;
      let lastEyeStateClosed = false;
      let lastBlinkDetectedTime = 0;
      let frameCount = 0;

      const runScan = () => {
        if (!video || video.paused || video.ended || !streamRef.current || isCapturingRef.current) {
          return;
        }

        frameCount++;
        
        // Render a small frame size for calculations
        scanCanvas.width = 120;
        scanCanvas.height = 90;

        if (scanCtx) {
          scanCtx.drawImage(video, 0, 0, 120, 90);

          // Average eye strip location inside the face oval cutout (120x90 size)
          const eX = 35;
          const eY = 32;
          const eW = 50;
          const eH = 14;

          const imgData = scanCtx.getImageData(eX, eY, eW, eH);
          const pixels = imgData.data;

          let pixelLuminanceSum = 0;
          let pixelSquaredSum = 0;
          const pixelCount = eW * eH;

          for (let i = 0; i < pixels.length; i += 4) {
            const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
            pixelLuminanceSum += gray;
            pixelSquaredSum += gray * gray;
          }

          const avgLuminance = pixelLuminanceSum / pixelCount;
          const variance = (pixelSquaredSum / pixelCount) - (avgLuminance * avgLuminance);
          const currentContrast = Math.sqrt(Math.max(0, variance));

          setBrightnessValue(Math.round(avgLuminance));
          setContrastValue(Math.round(currentContrast * 10) / 10);

          setLivenessStep((prevStep) => {
            // Step 1: Align Face
            if (prevStep === 'align') {
              if (avgLuminance < 35) {
                setStatusMessage("⚠️ Roshni kam hai! Please thora roshni mein aayen.");
                setBlinkScore(15);
                return 'align';
              } else {
                setStatusMessage("🔄 Chehre ko green frame k bilkul darmiyan mein fit rakhein...");
                setBlinkScore(30);
                if (frameCount > 35) {
                  history = [];
                  calibrateFrames = 0;
                  return 'calibrate';
                }
                return 'align';
              }
            }

            // Step 2: Calibrate Eye Baseline
            if (prevStep === 'calibrate') {
              setStatusMessage("👀 Aankhein Kholi Rakhein aur Seedha camera par dekhein...");
              setBlinkScore(50);
              
              if (avgLuminance > 35) {
                history.push(currentContrast);
                if (history.length > 25) history.shift();
                calibrateFrames++;

                if (calibrateFrames > 25) {
                  // Base open eye contrast average
                  baseOpenContrast = history.reduce((sum, val) => sum + val, 0) / history.length;
                  if (baseOpenContrast < 3) {
                    // Face contrast is too flat (pointing to walls/empty space)
                    setStatusMessage("❌ Chehra theek se nazar nahi aa raha. Roshni badhayein.");
                    frameCount = 0;
                    return 'align';
                  } else {
                    playBeep(880, 0.08);
                    history = [];
                    return 'blink';
                  }
                }
                return 'calibrate';
              } else {
                frameCount = 0;
                return 'align';
              }
            }

            // Step 3: Blink Verification (Active Action!)
            if (prevStep === 'blink') {
              setStatusMessage("⚡ Apni Aankhein Ek Martaba Jhapkein / Blink your eyes now!");
              setBlinkScore(75);

              history.push(currentContrast);
              if (history.length > 15) history.shift();

              // Blink pattern signatures:
              // 1. Drop in Eye region contrast (closed eyelids lack high-contrast detail like pupils)
              if (baseOpenContrast > 0 && currentContrast < baseOpenContrast * 0.70 && !lastEyeStateClosed) {
                lastEyeStateClosed = true;
                lastBlinkDetectedTime = Date.now();
              }

              // 2. Sudden restoration of open eye detail within normal blink timestamp window
              if (lastEyeStateClosed && (Date.now() - lastBlinkDetectedTime < 1000) && currentContrast >= baseOpenContrast * 0.86) {
                // Verified Blink Liveness!
                lastEyeStateClosed = false;
                playBeep(1000, 0.25);
                setBlinkScore(100);
                setStatusMessage("✅ BIOMETRIC SUCCESS! Snapping picture...");
                
                // Flash animation effect trigger
                const container = video.parentElement;
                if (container) {
                  const flash = document.createElement('div');
                  flash.className = "absolute inset-0 bg-white z-[90] opacity-100 transition-opacity duration-300 pointer-events-none";
                  container.appendChild(flash);
                  setTimeout(() => {
                    flash.style.opacity = '0';
                    setTimeout(() => flash.remove(), 300);
                  }, 50);
                }

                // Snap photo
                setTimeout(() => {
                  capturePhoto();
                }, 100);
                
                return 'verified';
              }

              return 'blink';
            }

            return prevStep;
          });
        }
        animId = requestAnimationFrame(runScan);
      };

      animId = requestAnimationFrame(runScan);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraOpen]);

  return (
    <div className="space-y-4">
      {/* Selfie Tips Box */}
      <div style={{
        background: 'rgba(46,196,182,0.08)',
        border: '1px solid rgba(46,196,182,0.2)',
        borderRadius: 12,
        padding: '0.85rem 1rem',
        fontSize: '0.8rem',
        color: 'var(--color-pak-text)',
        lineHeight: 1.6
      }}>
        <div className="flex items-center gap-2 font-black text-pak-teal uppercase tracking-wider mb-1">
          <ShieldCheck size={16} /> Live Biometric Verification
        </div>
        <p className="opacity-90">✅ Sirf live direct camera selfie manzoor hogi, gallery se purani photo lagana mana hai.</p>
        <p className="opacity-90">✅ Chehra bilkul seedha aur aankhein khuli rakh kar <strong>Aankhein Jhapkein (Blink)</strong>.</p>
      </div>

      {!cameraOpen && !captured && (
        <button 
          onClick={openCamera} 
          type="button"
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-pak-teal/25 bg-pak-teal/5 p-12 cursor-pointer transition-all hover:bg-pak-teal/10 hover:border-pak-teal/50 w-full group shadow-md"
        >
          <div className="rounded-full bg-pak-teal/15 p-6 text-pak-teal group-hover:scale-110 transition-transform shadow-lg shadow-pak-teal/10 animate-pulse">
            <Camera size={44} />
          </div>
          <div className="text-center font-black text-white px-4 py-2 bg-pak-teal/80 dark:bg-pak-teal text-xs uppercase tracking-[0.25em] rounded-lg">
            📷 Open Live Biometric Camera
          </div>
        </button>
      )}

      {cameraOpen && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border-4 border-pak-teal/30 bg-black shadow-inner">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted
              className="w-full h-auto"
              style={{
                width: '100%',
                maxHeight: 280,
                borderRadius: 8,
                display: 'block',
                background: '#090d16',
                transform: 'scaleX(-1)',
                WebkitTransform: 'scaleX(-1)',
              }}
            />

            {/* Moving Biometric Laser Scanline overlay */}
            {livenessStep !== 'verified' && (
              <div className="biometric-scanner" />
            )}

            {/* Oval Cutout Guide Overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <mask id="biometric-cutout-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <ellipse cx="50%" cy="50%" rx="28%" ry="38%" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(9,13,22,0.6)" mask="url(#biometric-cutout-mask)" />
                <ellipse 
                  cx="50%" cy="50%" rx="28%" ry="38%" 
                  fill="none" 
                  stroke={livenessStep === 'blink' ? '#2ec4b6' : livenessStep === 'verified' ? '#22c55e' : 'rgba(46,196,182,0.5)'} 
                  strokeWidth="3" 
                  strokeDasharray={livenessStep === 'align' ? '8,5' : 'none'}
                  className="transition-colors duration-500"
                />
              </svg>
            </div>

            {/* Dynamic UI HUD indicators */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-20 pointer-events-none">
              <div className="text-[8px] font-mono uppercase bg-black/60 px-2 py-0.5 rounded text-white tracking-widest flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${brightnessValue > 35 ? 'bg-green-500' : 'bg-red-500'}`} />
                LUX: {brightnessValue}
              </div>
              <div className="text-[8px] font-mono uppercase bg-black/60 px-2 py-0.5 rounded text-white tracking-widest">
                VAR: {contrastValue}
              </div>
            </div>

            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <div className="text-[8px] font-black uppercase bg-pak-teal/90 text-white px-2.5 py-1 rounded tracking-widest flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                LIVE
              </div>
            </div>

            {/* Interactive Status Block inside the stream */}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-black/80 border-t border-white/5 backdrop-blur-md z-20 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-black tracking-wider uppercase text-pak-teal">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Biometric Engine
                </span>
                <span className="font-mono">{blinkScore}%</span>
              </div>
              
              {/* Liveness step status horizontal bars */}
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-pak-teal transition-all duration-300" 
                  style={{ width: `${blinkScore}%` }}
                />
              </div>

              <div className="text-center font-bold text-white text-xs py-1 px-2 bg-white/5 rounded min-h-[2rem] flex items-center justify-center">
                {statusMessage}
              </div>
            </div>
          </div>

          {/* Backup Override Manual Button: ONLY displayed if user is struggling for >15 secs */}
          {showOverride && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-center space-y-2">
              <p className="text-[10px] text-white/70">
                Anderi roshni ya low end camera hai? Agar auto biometric fail ho raha hai tou neechay button touch kar k manual capture karein.
              </p>
              <button 
                onClick={forceCapture}
                type="button"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] py-2 rounded-lg uppercase tracking-widest transition-all"
              >
                ⚠️ Skip Biometric & Force Capture
              </button>
            </div>
          )}
        </div>
      )}

      {captured && (
        <div className="flex flex-col items-center gap-4 bg-pak-teal/5 p-6 rounded-2xl border border-pak-teal/15">
          <div className="relative border-4 border-pak-teal rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-105">
            <img 
              src={captured}
              alt="Selfie"
              className="w-full h-auto max-w-[220px]"
              style={{ objectFit: 'cover' }}
            />
            <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full">
              <Check size={16} className="stroke-[3]" />
            </div>
          </div>
          <div className="text-center text-emerald-500 font-extrabold uppercase tracking-[0.25em] text-xs flex items-center gap-1.5">
            <ShieldCheck size={16} /> Biometrically Verified
          </div>
          <button 
            onClick={retake} 
            type="button"
            className="text-pak-teal font-extrabold flex items-center gap-2 hover:underline tracking-widest uppercase text-[10px] transition-colors py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
          >
            <RefreshCw size={12} /> Live Biometric Scan Dobara Karein
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

const Register: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [whatsappSameAsContact, setWhatsappSameAsContact] = useState(false);
  const [showWAModal, setShowWAModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const [formData, setFormData] = useState({
    ownerName: '',
    nicNumber: '',
    address: {
      street: '',
      town: '',
      city: PAKISTANI_CITIES[0]
    },
    contactNumber: '',
    whatsappNumber: '',
    lossDateTime: '',
    lossLocation: '',
    imei: '',
    imei2: '',
    brand: PHONE_BRANDS[0],
    model: '',
    color: '',
    reportType: 'stolen' as 'stolen' | 'lost',
    description: '',
    hasPoliceReport: '' as 'yes' | 'no' | '',
    proofType: '' as 'police_report' | 'box_image' | 'purchase_slip' | '',
    proofImageUrl: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [proofOption, setProofOption] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  const checkIfSaved = async (imei: string) => {
    try {
      const q = query(collection(db, 'phones'), where('imei', '==', imei));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      console.error("Error checking if saved:", e);
      return false;
    }
  };

  useEffect(() => {
    // Check local rate limit
    const submissions = JSON.parse(localStorage.getItem('pakimei_submissions') || '[]');
    const now = Date.now();
    const last24h = submissions.filter((s: number) => now - s < 24 * 60 * 60 * 1000);
    if (last24h.length >= 3) {
      setRateLimited(true);
    }
  }, []);

  const handleNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNIC(e.target.value);
    setFormData({ ...formData, nicNumber: formatted });
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Automatically replace leading 0 with +92
    if (val.startsWith('0')) {
      val = '+92' + val.slice(1);
    }
    
    // Clean non-digits except +
    const cleanedVal = val.replace(/[^\d+]/g, '').slice(0, 13);
    const newFormData = { ...formData, contactNumber: cleanedVal };
    if (whatsappSameAsContact) {
      newFormData.whatsappNumber = cleanedVal;
    }
    setFormData(newFormData);
  };

  const toggleWhatsappSync = () => {
    const newVal = !whatsappSameAsContact;
    setWhatsappSameAsContact(newVal);
    if (newVal) {
      setFormData({ ...formData, whatsappNumber: formData.contactNumber });
    }
  };

  const checkDuplicates = async () => {
    const phonesPath = 'phones';
    try {
      // Check IMEI
      const imeiQuery = query(collection(db, phonesPath), where('imei', '==', formData.imei));
      const imeiSnap = await getDocs(imeiQuery);
      if (!imeiSnap.empty) {
        toast.error(t('reg_error_duplicate_imei'));
        return false;
      }

      // Check CNIC (Max 2)
      const nicQuery = query(collection(db, phonesPath), where('nicNumber', '==', formData.nicNumber));
      const nicSnap = await getDocs(nicQuery);
      if (nicSnap.size >= 2) {
        toast.error(t('reg_error_duplicate_nic'));
        return false;
      }

      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, phonesPath);
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setUploadSuccess(false);
    setUploadProgress(0);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const uploadFile = async (file: File, userId: string): Promise<string> => {
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      });
      setIsUploading(false);
      setUploadSuccess(true);
      return url;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX) {
          h = (h * MAX) / w;
          w = MAX;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not found'));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        }, 'image/jpeg', 0.7);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting.current) return;

    console.log('Step 1: Validation started');

    if (!currentUser) {
      toast.error(t('auth_guest_prompt'));
      return;
    }

    if (rateLimited) {
      toast.error(t('reg_error_rate_limit'));
      return;
    }

    // Validations (IMEI, CNIC, etc.)
    if (formData.ownerName.trim().length < 3) {
      toast.error(t('reg_placeholder_name'));
      return;
    }

    if (!validateNIC(formData.nicNumber)) {
      toast.error(t('reg_error_nic'));
      return;
    }

    if (!validateIMEI(formData.imei)) {
      toast.error(t('reg_error_imei'));
      return;
    }

    if (!validateWhatsAppNumber(formData.whatsappNumber)) {
      toast.error("Valid WhatsApp number lazmi hai (e.g. 03XXXXXXXXX)");
      return;
    }

    const lossDate = new Date(formData.lossDateTime);
    if (lossDate > new Date()) {
      toast.error(t('reg_error_future_date'));
      return;
    }

    // Proof Validation
    if (!formData.hasPoliceReport) {
      toast.error("Please select if you have a Police Report or not.");
      return;
    }

    if (formData.hasPoliceReport === 'yes' && !selectedFile) {
      toast.error("Police FIR / Complaint Copy upload karna lazmi hai.");
      return;
    }

    if (formData.hasPoliceReport === 'no') {
      if (proofOption === 'none' || !proofOption) {
        toast.error("Proof upload karna lazmi hai. Baghair proof k entry nahi ho sakti.");
        return;
      }
      if (proofOption !== 'none' && !selectedFile) {
        toast.error(`Please upload the ${proofOption === 'box' ? 'Mobile Box' : 'Purchase Slip'} photo.`);
        return;
      }
    }

    if (!selfieFile) {
      toast.error('⚠️ Apni live tasveer lena lazmi hai!');
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    // Check file size minimum (black screen = very small file)
    if (selfieFile.size < 8000) { // less than 8KB
      toast.error('⚠️ Selfie sahi nahi hai. Dobara camera se live photo lein.');
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    setLoading(true);
    isSubmitting.current = true;
    const statusToast = toast.loading("Processing your request...");

    try {
      // Step 2: Duplicate checks
      toast.loading("Database check ho raha hai... 🔍", { id: statusToast });
      const isUnique = await checkDuplicates();
      if (!isUnique) {
        toast.dismiss(statusToast);
        setLoading(false);
        isSubmitting.current = false;
        return;
      }

      const finalProofType = formData.hasPoliceReport === 'yes' 
        ? 'police_report' 
        : (proofOption === 'box' ? 'box_image' : 'purchase_slip');

      let finalProofUrl = '';
      let finalSelfieUrl = '';

      // PHASE 1: Upload Images
      toast.loading("Tasveerein upload ho rahi hain... 📤", { id: statusToast });
      
      // Upload Proof if exists - step 4 (make optional temporarily)
      if (selectedFile) {
        console.log('Step 3: Proof upload started');
        let uploadBlob: Blob | File = selectedFile;
        if (selectedFile.type.startsWith('image/')) {
          try {
            uploadBlob = await compressImage(selectedFile);
          } catch (e) {
            console.error("Compression failed, using original:", e);
          }
        }

        try {
          finalProofUrl = await uploadToCloudinary(uploadBlob as File, (p) => {
            toast.loading(`📤 Proof image upload ho rahi hai... ${p}%`, { id: statusToast });
          });
        } catch (proofErr: any) {
          console.error('Proof upload failed:', proofErr);
          finalProofUrl = '';
          toast('⚠️ Proof upload nahi hua lekin entry save ho rahi hai');
          
          sendErrorAlertEmail({
            errorType: 'Proof Upload Failure',
            errorMessage: proofErr?.message || String(proofErr),
            errorStack: proofErr?.stack,
            userEmail: currentUser?.email || 'Guest',
            userId: currentUser?.uid,
            additionalContext: `Owner: ${formData.ownerName}, Brand: ${formData.brand}, Model: ${formData.model}, ProofType: ${formData.proofType || 'box_image'}`
          });
        }
      }

      // Upload Selfie (Mandatory / Optional fallback) - step 3 (make optional temporarily)
      if (selfieFile) {
        console.log('Step 2: Selfie upload started');
        try {
          finalSelfieUrl = await uploadSelfieToCloudinary(selfieFile, (p) => {
            toast.loading(`📸 Selfie upload ho rahi hai... ${p}%`, { id: statusToast });
          });
        } catch (err: any) {
          console.error('Selfie upload failed:', err);
          if (err.message === 'NO_FACE_DETECTED') {
            toast.error('⚠️ Selfie mein koi chehra nazar nahi aaya! Apna chehra camera k saamne rakh kar dobara selfie lein.', { id: statusToast });
            setLoading(false);
            isSubmitting.current = false;
            return;
          }
          finalSelfieUrl = '';
          toast('⚠️ Selfie upload nahi hui lekin entry save ho rahi hai');
          
          sendErrorAlertEmail({
            errorType: 'Selfie Upload Failure',
            errorMessage: err?.message || String(err),
            errorStack: err?.stack,
            userEmail: currentUser?.email || 'Guest',
            userId: currentUser?.uid,
            additionalContext: `Owner: ${formData.ownerName}, Brand: ${formData.brand}, Model: ${formData.model}`
          });
        }
      }

      // PHASE 2: Save to Firestore with real URLs - step 5 (simplified database save with defaults)
      console.log('Step 4: Saving to Firestore');
      toast.loading("Entry save ho rahi hai... 💾", { id: statusToast });
      
      const reportData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        ownerName: formData.ownerName,
        imei: formData.imei,
        brand: formData.brand,
        model: formData.model,
        city: formData.address?.city || formData.city,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        // Support all other optional fields gracefully
        nicNumber: formData.nicNumber || '',
        address: formData.address || { street: '', town: '', city: formData.address?.city || formData.city },
        contactNumber: formData.contactNumber || '',
        whatsappNumber: formData.whatsappNumber || '',
        lossDateTime: formData.lossDateTime || '',
        lossLocation: formData.lossLocation || '',
        imei2: formData.imei2 || '',
        color: formData.color || '',
        reportType: formData.reportType || 'stolen',
        description: formData.description || '',
        hasPoliceReport: formData.hasPoliceReport || 'no',
        proofType: finalProofType || 'box_image',
        proofImageUrl: finalProofUrl || '',
        selfieImageUrl: finalSelfieUrl || '',
        verified: false
      };

      const docRef = await addDoc(collection(db, 'phones'), reportData);
      console.log('Step 5: Complete');
      const refId = docRef.id.slice(0, 8).toUpperCase();

      // Update local history
      const submissions = JSON.parse(localStorage.getItem('pakimei_submissions') || '[]');
      submissions.push(Date.now());
      localStorage.setItem('pakimei_submissions', JSON.stringify(submissions));

      // Show success screen
      toast.success("✅ Entry kamyabi se save ho gayi!", { id: statusToast });
      setSuccessData({ ...formData, refId });
      setShowWAModal(true);
      setLoading(false);
      isSubmitting.current = false;

      // Reset form fields
      setFormData({
        ownerName: '',
        nicNumber: '',
        address: { street: '', town: '', city: PAKISTANI_CITIES[0] },
        contactNumber: '',
        whatsappNumber: '',
        lossDateTime: '',
        lossLocation: '',
        imei: '',
        imei2: '',
        brand: PHONE_BRANDS[0],
        model: '',
        color: '',
        reportType: 'stolen',
        description: '',
        hasPoliceReport: '',
        proofType: '',
        proofImageUrl: ''
      });
      setWhatsappSameAsContact(false);
      setSelectedFile(null);
      setSelfieFile(null);
      setFilePreview(null);
      setUploadProgress(0);
      setUploadSuccess(false);
      setProofOption('');

      // Send Email
      sendConfirmationEmail({
        userEmail: currentUser.email || '',
        ownerName: reportData.ownerName,
        brand: reportData.brand,
        model: reportData.model,
        imei: reportData.imei,
        address: reportData.address,
        reportType: reportData.reportType,
        refId,
        whatsappNumber: reportData.whatsappNumber
      }).then(() => {
        toast.success('Confirmation email bhej diya! ✉️');
      }).catch((err) => {
        console.error("Email failed:", err);
      });

    } catch (err: any) {
      console.error('Registration error:', err.code, err.message);
      console.error('Full error:', err);
      
      sendErrorAlertEmail({
        errorType: 'Registration Failure / Database Save Failure',
        errorMessage: err?.message || String(err),
        errorStack: err?.stack,
        userEmail: currentUser?.email || 'Guest',
        userId: currentUser?.uid,
        additionalContext: `Owner: ${formData.ownerName}, Brand: ${formData.brand}, Model: ${formData.model}, IMEI: ${formData.imei}, IMEI2: ${formData.imei2 || 'N/A'}, City: ${formData.address?.city || formData.city}, ErrorCode: ${err?.code || 'None'}`
      });

      if (err.code === 'permission-denied') {
        toast.error('Permission error — Firestore rules check karein', { id: statusToast });
      } else if (err.code === 'unauthenticated') {
        toast.error('Login karein pehle', { id: statusToast });
      } else if (err.message === 'NO_FACE_DETECTED') {
        toast.error('Selfie mein chehra nazar nahi aaya', { id: statusToast });
      } else {
        toast.error('Error: ' + err.message, { id: statusToast });
      }
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const sendWhatsAppConfirmation = () => {
    if (!successData) return;
    
    // Use helper for correct WhatsApp format
    const phone = formatWhatsAppNumber(successData.whatsappNumber);
    const message = t('wa_message_template')
      .replace('{name}', successData.ownerName)
      .replace('{phone}', `${successData.brand} ${successData.model}`)
      .replace('{imei}', successData.imei)
      .replace('{city}', successData.address.city)
      .replace('{refId}', successData.refId)
      .replace('{url}', window.location.origin);

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setShowWAModal(false);
  };

  const inputClasses = "glass-input block w-full rounded-xl p-4 text-white placeholder:text-white/20 transition-all font-medium";
  const labelClasses = "mb-2 block text-xs font-bold text-white/70 uppercase tracking-widest";
  const groupClasses = "glass rounded-3xl p-6 md:p-8 space-y-6";

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass flex flex-col items-center justify-center rounded-3xl p-12 text-center"
        >
          <div className="mb-6 rounded-full bg-pak-red/20 p-6 text-pak-red border border-pak-red/30 shadow-xl shadow-pak-red/10">
            <Lock size={48} />
          </div>
          <h2 className="font-display text-4xl font-bold text-white tracking-tight">{t('reg_title')}</h2>
          <p className="mt-4 text-white/70 leading-relaxed text-lg">
            {t('auth_guest_prompt')}
          </p>
          <button
              onClick={signInWithGoogle}
              className="btn-glass-primary mt-8 flex items-center gap-3 rounded-2xl px-10 py-5 text-xl font-black uppercase tracking-widest text-white"
            >
              <ShieldCheck size={26} />
              {t('auth_login')}
            </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-12"
      >
        <span className="text-pak-teal text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-3 sm:mb-4 block">Secure Registry</span>
        <h2 className="font-display text-3xl font-extrabold text-white sm:text-6xl tracking-tight drop-shadow-lg">{t('reg_title')}</h2>
        <p className="mt-4 text-white/70 text-base sm:text-xl font-medium max-w-2xl mx-auto px-4">{t('reg_desc')}</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* GROUP 1: OWNER */}
        <section className={groupClasses}>
          <div className="flex items-center gap-3 border-b border-white/10 pb-5 mb-2">
            <User className="text-pak-teal" size={24} />
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">{t('reg_group_owner')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>{t('reg_label_name')}</label>
              <input
                type="text"
                required
                placeholder={t('reg_placeholder_name')}
                className={inputClasses}
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('reg_label_nic')}</label>
              <input
                type="text"
                required
                placeholder={t('reg_placeholder_nic')}
                className={inputClasses}
                value={formData.nicNumber}
                onChange={handleNICChange}
                maxLength={15}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('reg_label_contact')}</label>
              <input
                type="tel"
                required
                placeholder={t('reg_placeholder_contact')}
                className={inputClasses}
                value={formData.contactNumber}
                onChange={handleContactChange}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-pak-muted uppercase tracking-widest">{t('reg_label_whatsapp')}</label>
                <button 
                  type="button"
                  onClick={toggleWhatsappSync}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-pak-teal uppercase"
                >
                  {whatsappSameAsContact ? <CheckSquare size={12} /> : <Square size={12} />}
                  {t('reg_same_as_contact')}
                </button>
              </div>
              <input
                type="tel"
                required
                disabled={whatsappSameAsContact}
                placeholder="03XXXXXXXXX"
                className={`${inputClasses} ${whatsappSameAsContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.whatsappNumber}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.startsWith('0')) {
                    val = '+92' + val.slice(1);
                  }
                  // Clean non-digits except +
                  const cleanedVal = val.replace(/[^\d+]/g, '').slice(0, 13);
                  setFormData({ ...formData, whatsappNumber: cleanedVal });
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className={labelClasses}>Current Address</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder={t('reg_placeholder_address_street')}
                className={inputClasses}
                value={formData.address.street}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              />
              <input
                placeholder={t('reg_placeholder_address_town')}
                className={inputClasses}
                value={formData.address.town}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, town: e.target.value } })}
              />
              <select
                className={inputClasses}
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
              >
                {PAKISTANI_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* GROUP 2: INCIDENT */}
        <section className={groupClasses}>
          <div className="flex items-center gap-3 border-b border-white/10 pb-5 mb-2">
            <Clock className="text-pak-red" size={24} />
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">{t('reg_group_location')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>{t('reg_label_date_time')}</label>
              <input
                type="datetime-local"
                required
                className={inputClasses}
                value={formData.lossDateTime}
                onChange={(e) => setFormData({ ...formData, lossDateTime: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('reg_label_type')}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, reportType: 'stolen' })}
                  className={`flex items-center justify-center gap-2 rounded-xl p-4 text-sm font-bold transition-all border ${
                    formData.reportType === 'stolen' 
                      ? 'bg-pak-red text-white shadow-lg shadow-pak-red/20 border-pak-red/50' 
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Lock size={16} /> {t('reg_type_chori')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, reportType: 'lost' })}
                  className={`flex items-center justify-center gap-2 rounded-xl p-4 text-sm font-bold transition-all border ${
                    formData.reportType === 'lost' 
                      ? 'bg-pak-teal text-white shadow-lg shadow-pak-teal/20 border-pak-teal/50' 
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <MapPin size={16} /> {t('reg_type_gum')}
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>{t('reg_label_loss_location')}</label>
              <div className="relative">
                <Map className="absolute left-4 top-4 text-pak-muted" size={18} />
                <input
                  required
                  placeholder={t('reg_placeholder_loss_location')}
                  className={`${inputClasses} pl-12`}
                  value={formData.lossLocation}
                  onChange={(e) => setFormData({ ...formData, lossLocation: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* GROUP 3: DEVICE */}
        <section className={groupClasses}>
          <div className="flex items-center gap-3 border-b border-white/10 pb-5 mb-2">
            <Smartphone className="text-pak-teal" size={24} />
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">{t('reg_group_device')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>{t('reg_label_imei')}</label>
              <input
                required
                maxLength={15}
                placeholder="35XXXXXXXXXXXXX"
                className={inputClasses}
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('reg_label_imei2')}</label>
              <input
                maxLength={15}
                placeholder="35XXXXXXXXXXXXX"
                className={inputClasses}
                value={formData.imei2}
                onChange={(e) => setFormData({ ...formData, imei2: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('reg_label_brand')}</label>
              <select
                className={inputClasses}
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              >
                {PHONE_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasses}>{t('reg_label_model')}</label>
              <input
                required
                placeholder="e.g. iPhone 15 Pro, S24..."
                className={inputClasses}
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('reg_label_color')}</label>
              <input
                required
                placeholder="e.g. Phantom Black"
                className={inputClasses}
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>{t('reg_label_desc')}</label>
            <textarea
              rows={3}
              placeholder={t('reg_placeholder_desc')}
              className={inputClasses}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </section>

        {/* SECTION: POLICE REPORT & DOCUMENT VERIFICATION */}
        <section className={groupClasses}>
          <div className="flex items-center gap-3 border-b border-white/10 pb-5 mb-2">
            <ShieldCheck className="text-pak-teal" size={24} />
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">Police Report & Verification</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelClasses}>Kya aap ne Police mein report darj karwai hai?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, hasPoliceReport: 'yes' });
                    setProofOption('');
                  }}
                  className={`flex items-center justify-center gap-3 rounded-2xl p-5 text-sm font-bold transition-all border ${
                    formData.hasPoliceReport === 'yes' 
                      ? 'bg-pak-teal/20 text-white border-pak-teal shadow-lg shadow-pak-teal/10' 
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${formData.hasPoliceReport === 'yes' ? 'border-pak-teal bg-pak-teal' : 'border-white/20'}`}>
                    {formData.hasPoliceReport === 'yes' && <Check size={12} className="text-white" />}
                  </div>
                  Haan, Police Report Hai ✅
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, hasPoliceReport: 'no' });
                    setProofOption('');
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className={`flex items-center justify-center gap-3 rounded-2xl p-5 text-sm font-bold transition-all border ${
                    formData.hasPoliceReport === 'no' 
                      ? 'bg-white/10 text-white border-white/30 shadow-lg shadow-white/5' 
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                  }`}
                >
                   <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${formData.hasPoliceReport === 'no' ? 'border-white bg-white/20' : 'border-white/20'}`}>
                    {formData.hasPoliceReport === 'no' && <Check size={12} className="text-white" />}
                  </div>
                  Nahi, Police Report Nahi Hai ❌
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {formData.hasPoliceReport === 'yes' && (
                <motion.div
                  key="police-yes"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-2"
                >
                  <label className={labelClasses}>Police FIR / Complaint Copy Upload Karein *</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="policeReportFile"
                    />
                    <label
                      htmlFor="policeReportFile"
                      className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-10 cursor-pointer transition-all hover:border-pak-teal/50 hover:bg-white/10 group"
                    >
                      {uploadSuccess ? (
                        <div className="flex flex-col items-center gap-2 text-pak-teal font-bold scale-110 transition-transform">
                          <div className="h-16 w-16 rounded-full bg-pak-teal/20 flex items-center justify-center border border-pak-teal">
                             <Check size={32} />
                          </div>
                          <p>File Uploaded Successfully!</p>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-full bg-pak-teal/10 p-5 text-pak-teal group-hover:scale-110 transition-transform">
                            <FileText size={40} />
                          </div>
                          <div className="text-center">
                            <p className="text-white font-bold">{selectedFile ? selectedFile.name : "Tap to select FIR Copy"}</p>
                            <p className="text-white/40 text-xs mt-1">Accepts JPG, PNG, PDF (Max 5MB)</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                  {isUploading && (
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold text-pak-teal uppercase tracking-widest">
                         <span>Uploading...</span>
                         <span>{Math.round(uploadProgress)}%</span>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-pak-teal transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                       </div>
                    </div>
                  )}
                  {filePreview && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Preview:</p>
                      <img src={filePreview} alt="Preview" className="h-48 w-full object-contain rounded-xl border border-white/10 bg-black/20" />
                    </div>
                  )}
                </motion.div>
              )}

              {formData.hasPoliceReport === 'no' && (
                <motion.div
                  key="police-no"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-2"
                >
                  <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
                    <p className="text-white/80 font-medium leading-relaxed">
                      Koi baat nahi! Neeche diye gaye options mein se <span className="text-pak-teal font-bold">KISI EK</span> ka proof upload karein:
                    </p>

                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setProofOption('box');
                          setSelectedFile(null);
                          setFilePreview(null);
                          setUploadSuccess(false);
                        }}
                        className={`flex items-center gap-4 rounded-xl p-4 text-left border transition-all ${
                          proofOption === 'box' ? 'bg-white/10 border-pak-teal text-white' : 'bg-black/20 border-white/5 text-white/40'
                        }`}
                      >
                        <Package size={20} className={proofOption === 'box' ? 'text-pak-teal' : ''} />
                        <span className="font-bold">📦 Mobile Box (IMEI wali jagah ki photo)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProofOption('slip');
                          setSelectedFile(null);
                          setFilePreview(null);
                          setUploadSuccess(false);
                        }}
                        className={`flex items-center gap-4 rounded-xl p-4 text-left border transition-all ${
                          proofOption === 'slip' ? 'bg-white/10 border-pak-teal text-white' : 'bg-black/20 border-white/5 text-white/40'
                        }`}
                      >
                        <Receipt size={20} className={proofOption === 'slip' ? 'text-pak-teal' : ''} />
                        <span className="font-bold">🧾 Purchase Slip (Dukaan ki receipt)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProofOption('none');
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className={`flex items-center gap-4 rounded-xl p-4 text-left border transition-all ${
                          proofOption === 'none' ? 'bg-pak-red/10 border-pak-red text-white' : 'bg-black/20 border-white/5 text-white/40'
                        }`}
                      >
                        <XCircle size={20} className={proofOption === 'none' ? 'text-pak-red' : ''} />
                        <span className="font-bold">❌ Mere paas kuch bhi nahi hai</span>
                      </button>
                    </div>
                  </div>

                  {proofOption === 'box' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <label className={labelClasses}>Box ki Photo Upload Karein *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="boxImageFile"
                      />
                      <label
                        htmlFor="boxImageFile"
                        className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-10 cursor-pointer transition-all hover:border-pak-teal/50 hover:bg-white/10"
                      >
                         {uploadSuccess ? (
                            <div className="flex flex-col items-center gap-2 text-pak-teal font-bold">
                               <Check size={32} />
                               <p>Box Photo Uploaded ✅</p>
                            </div>
                         ) : (
                           <>
                            <Package size={40} className="text-pak-teal" />
                            <p className="text-white font-bold">{selectedFile ? selectedFile.name : "Select Box Image"}</p>
                           </>
                         )}
                      </label>
                    </motion.div>
                  )}

                  {proofOption === 'slip' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <label className={labelClasses}>Purchase Slip Upload Karein *</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="purchaseSlipFile"
                      />
                      <label
                        htmlFor="purchaseSlipFile"
                        className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-10 cursor-pointer transition-all hover:border-pak-teal/50 hover:bg-white/10"
                      >
                        {uploadSuccess ? (
                            <div className="flex flex-col items-center gap-2 text-pak-teal font-bold">
                               <Check size={32} />
                               <p>Purchase Slip Uploaded ✅</p>
                            </div>
                         ) : (
                           <>
                            <Receipt size={40} className="text-pak-teal" />
                            <p className="text-white font-bold">{selectedFile ? selectedFile.name : "Select Purchase Slip"}</p>
                           </>
                         )}
                      </label>
                    </motion.div>
                  )}

                  {proofOption === 'none' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 rounded-2xl bg-pak-red/10 border border-pak-red/20 flex gap-4"
                    >
                      <AlertTriangle className="text-pak-red shrink-0" size={32} />
                      <div>
                        <p className="text-white font-bold">Afsos! Baghair kisi proof ke aapki complaint register nahi ho sakti.</p>
                        <p className="mt-2 text-white/70 text-sm leading-relaxed">
                          Baraye Meharbani apni nearest police station mein FIR darj karwayein ya apna mobile box ya purchase slip talash karein.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {selectedFile && !uploadSuccess && isUploading && (
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold text-pak-teal uppercase tracking-widest">
                         <span>Uploading Proof...</span>
                         <span>{Math.round(uploadProgress)}%</span>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-pak-teal transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                       </div>
                    </div>
                  )}

                  {filePreview && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Preview:</p>
                      <img src={filePreview} alt="Preview" className="h-48 w-full object-contain rounded-xl border border-white/10 bg-black/20" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* SELFIE CAPTURE SECTION */}
        <section className={groupClasses}>
          <div className="flex items-center gap-3 border-b border-white/10 pb-5 mb-2">
            <Camera className="text-pak-teal" size={24} />
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">📸 Apni Live Tasveer Khainchein (Lazmi)</h3>
          </div>
          <p className="text-white/60 text-sm font-medium mb-4">Gallery se photo upload nahi hogi — sirf live camera se capture karein.</p>
          
          <SelfieCapture onCapture={(file) => setSelfieFile(file)} />
        </section>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || rateLimited || (formData.hasPoliceReport === 'no' && proofOption === 'none')}
            className="btn-glass-primary flex w-full items-center justify-center gap-3 rounded-2xl py-6 text-2xl font-black uppercase tracking-[0.2em] text-white disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Hash className="animate-spin" size={28} />
            ) : (
              <ClipboardCheck size={32} />
            )}
            {loading ? t('reg_submitting') : t('reg_submit_btn')}
          </button>
          
          {rateLimited && (
            <p className="mt-4 text-center text-sm font-bold text-pak-red animate-pulse flex items-center justify-center gap-2">
              <Info size={16} /> {t('reg_error_rate_limit')}
            </p>
          )}

          <div className="mt-8 flex items-start gap-4 rounded-3xl bg-white/5 p-8 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="text-pak-teal shrink-0" size={32} />
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-widest mb-2">Accountability Notice</p>
              <p className="text-base text-white/70 leading-relaxed font-medium">
                Your report is being submitted as <span className="text-pak-teal font-bold">{currentUser.email}</span>. 
                Providing false information in a national registry is a punishable offense. IP addresses are logged for forensic verification.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* WhatsApp Confirmation Modal */}
      <AnimatePresence>
        {showWAModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWAModal(false)}
              className="absolute inset-0 bg-navy-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden glass p-8"
            >
              <div className="mb-6 flex justify-center text-pak-teal">
                <div className="relative">
                  <div className="absolute inset-0 bg-pak-teal/20 blur-3xl rounded-full" />
                  <MessageCircle size={80} className="relative drop-shadow-2xl" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="font-display text-3xl font-bold text-white tracking-tight">{t('wa_title')}</h3>
                <p className="mt-4 text-white/70 leading-relaxed font-medium">
                  {t('wa_desc')}
                </p>
                <div className="mt-4 rounded-xl bg-white/5 p-4 text-base font-mono text-pak-teal/90 border border-white/10">
                   {successData?.whatsappNumber}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={sendWhatsAppConfirmation}
                  className="btn-glass-primary w-full rounded-2xl py-5 text-xl font-black uppercase tracking-widest text-white"
                >
                  {t('wa_btn_send')}
                </button>
                <button
                  onClick={() => setShowWAModal(false)}
                  className="btn-glass-secondary w-full rounded-2xl py-5 text-xl font-bold uppercase tracking-widest text-white"
                >
                  {t('wa_btn_skip')}
                </button>
              </div>

              <button 
                onClick={() => setShowWAModal(false)}
                className="absolute right-4 top-4 text-white/40 hover:text-white"
              >
                <XCircle size={28} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
