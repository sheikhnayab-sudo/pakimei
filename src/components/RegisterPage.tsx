import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
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
import { PAKISTANI_CITIES, PHONE_BRANDS, formatNIC, validateNIC, validateIMEI } from '../constants';
import { sendConfirmationEmail } from '../services/emailService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const SelfieCapture = ({ onCapture }: { onCapture: (file: File) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face detection models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Using external weights to ensure it works without manual file setup
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Face-api models load error:", err);
      }
    };
    loadModels();
  }, []);

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraOpen(true);
    } catch (err) {
      toast.error('Camera access nahi mila. Permission dein.');
    }
  };

  // Continuous face detection loop
  useEffect(() => {
    let interval: any;
    if (cameraOpen && modelsLoaded && videoRef.current) {
      interval = setInterval(async () => {
        if (videoRef.current) {
          const detection = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          );
          setFaceDetected(!!detection);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [cameraOpen, modelsLoaded]);

  const capturePhoto = async () => {
    if (!modelsLoaded) {
      toast.error('Face detection load ho rahi hai. Thoda wait karein.');
      return;
    }

    if (!videoRef.current) return;

    // Final face check before capture
    const detection = await faceapi.detectSingleFace(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    );

    if (!detection) {
      toast.error('⚠️ Koi chehra nazar nahi aaya! Apna chehra camera k saamne rakhein.');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !stream) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        });
        setCaptured(URL.createObjectURL(blob));
        onCapture(file);
        stream.getTracks().forEach(t => t.stop());
        setCameraOpen(false);
        setStream(null);
        toast.success('✅ Tasveer kamyabi se li gayi!');
      }
    }, 'image/jpeg', 0.8);
  };

  const retake = () => {
    setCaptured(null);
    openCamera();
  };

  return (
    <div className="space-y-4">
      {!cameraOpen && !captured && (
        <button 
          onClick={openCamera} 
          type="button"
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-10 cursor-pointer transition-all hover:border-pak-teal/50 hover:bg-white/10 w-full group"
        >
          <div className="rounded-full bg-pak-teal/10 p-5 text-pak-teal group-hover:scale-110 transition-transform">
            <Camera size={40} />
          </div>
          <div className="text-center font-bold text-white uppercase tracking-widest text-sm">
            📷 Camera Kholein
          </div>
        </button>
      )}
      
      {cameraOpen && (
        <div className="space-y-4">
          <div className={`relative overflow-hidden rounded-2xl border-4 transition-colors bg-black ${
            faceDetected ? 'border-pak-teal' : 'border-pak-red'
          }`}>
            <video ref={videoRef} autoPlay playsInline 
              className="w-full h-auto"
              style={{ maxHeight: 300 }}
            />
            {/* Live status overlay */}
            <div className={`absolute bottom-0 inset-x-0 p-3 text-center text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${
              faceDetected ? 'bg-pak-teal/20 text-pak-teal' : 'bg-pak-red/20 text-pak-red'
            }`}>
              {faceDetected 
                ? '✅ Chehra detect ho gaya — Photo khainch sakte hain!' 
                : '⚠️ Apna chehra camera k bilkul saamne rakhein...'}
            </div>
          </div>
          <button 
            onClick={capturePhoto} 
            type="button"
            disabled={!faceDetected}
            className={`w-full bg-pak-teal text-white font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              faceDetected ? 'hover:scale-[1.02] active:scale-95' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Camera size={20} /> Photo Khainchein
          </button>
        </div>
      )}
      
      {captured && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative border-4 border-pak-teal rounded-2xl overflow-hidden shadow-2xl">
            <img src={captured} 
              alt="Selfie"
              className="w-full h-auto max-w-[250px]"
              style={{ objectFit: 'cover' }}
            />
            <div className="absolute top-2 right-2 bg-pak-teal text-white p-1 rounded-full">
              <Check size={16} />
            </div>
          </div>
          <button 
            onClick={retake} 
            type="button"
            className="text-pak-teal font-bold flex items-center gap-2 hover:underline tracking-widest uppercase text-xs"
          >
            <RefreshCw size={14} /> Dobara Khainchein
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
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    const newFormData = { ...formData, contactNumber: val };
    if (whatsappSameAsContact) {
      newFormData.whatsappNumber = val;
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

      // Check NIC (Max 2)
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

    if (!currentUser) {
      toast.error(t('auth_guest_prompt'));
      return;
    }

    if (rateLimited) {
      toast.error(t('reg_error_rate_limit'));
      return;
    }

    // Validations (IMEI, NIC, etc.)
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

      // PHASE 1: Save entry immediately
      toast.loading("Entry save ho rahi hai... 💾", { id: statusToast });
      const reportData = {
        ...formData,
        city: formData.address.city, // Flatten city for easier querying and Feed display
        proofType: finalProofType,
        proofImageUrl: selectedFile ? 'uploading' : '',
        selfieImageUrl: 'uploading',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        verified: false
      };

      const docRef = await addDoc(collection(db, 'phones'), reportData);
      const refId = docRef.id.slice(0, 8).toUpperCase();

      // Show success screen immediately
      toast.success("✅ Entry save ho gayi!", { id: statusToast });
      setSuccessData({ ...formData, refId });
      setShowWAModal(true);
      setLoading(false);
      isSubmitting.current = false;

      // Reset form fields but keep selectedFile for background upload
      const currentSelectedFile = selectedFile;
      const currentSelfieFile = selfieFile;
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

      // PHASE 2: Background Upload & Finalization
      (async () => {
        const bgToast = toast.loading("📤 Data upload ho raha hai...");
        try {
          let finalProofUrl = '';
          let finalSelfieUrl = '';

          // Upload Proof if exists
          if (currentSelectedFile) {
            let uploadBlob: Blob | File = currentSelectedFile;
            if (currentSelectedFile.type.startsWith('image/')) {
              try {
                uploadBlob = await compressImage(currentSelectedFile);
              } catch (e) {
                console.error("Compression failed, using original:", e);
              }
            }

            finalProofUrl = await uploadToCloudinary(uploadBlob as File, (p) => {
              toast.loading(`📤 Proof image upload ho rahi hai... ${p}%`, { id: bgToast });
            });
          }

          // Upload Selfie (Mandatory)
          if (currentSelfieFile) {
            finalSelfieUrl = await uploadToCloudinary(currentSelfieFile, (p) => {
              toast.loading(`📸 Selfie upload ho rahi hai... ${p}%`, { id: bgToast });
            });
          }

          // Update Firestore with real URLs
          await updateDoc(doc(db, 'phones', docRef.id), {
            proofImageUrl: finalProofUrl,
            selfieImageUrl: finalSelfieUrl
          });

          // Send Email in background
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
            console.error("Background email failed:", err);
            toast.error('Email nahi gaya, lekin entry save ho gayi ✅');
          });

          toast.success("✅ Sab kuch complete!", { id: bgToast });
          
          // Update local history
          const submissions = JSON.parse(localStorage.getItem('pakimei_submissions') || '[]');
          submissions.push(Date.now());
          localStorage.setItem('pakimei_submissions', JSON.stringify(submissions));

        } catch (error) {
          console.error("Background upload failed:", error);
          toast.error("⚠️ Image upload fail ho gayi, lekin entry save hai.", { id: bgToast });
        }
      })();

    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(t('reg_error_generic'), { id: statusToast });
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const sendWhatsAppConfirmation = () => {
    if (!successData) return;
    
    // Convert 03xx to 923xx
    const phone = '92' + successData.whatsappNumber.slice(1);
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
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 11) })}
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
