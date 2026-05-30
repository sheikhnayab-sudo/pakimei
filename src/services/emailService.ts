import emailjs from '@emailjs/browser';

interface EmailData {
  userEmail: string;
  ownerName: string;
  brand: string;
  model: string;
  imei: string;
  address: {
    city: string;
  };
  reportType: string;
  refId: string;
  whatsappNumber: string;
}

export const sendConfirmationEmail = async (data: EmailData) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  console.log('--- EmailJS Debug Info ---');
  console.log('Service ID:', serviceId ? 'Present' : 'MISSING');
  console.log('Template ID:', templateId ? 'Present' : 'MISSING');
  console.log('Public Key:', publicKey ? 'Present' : 'MISSING');
  console.log('Sending email to:', data.userEmail);

  if (!serviceId || !templateId || !publicKey) {
    console.error('EmailJS environment variables are missing!');
    throw new Error('EmailJS configuration missing');
  }

  const templateParams = {
    to_email: data.userEmail,
    owner_name: data.ownerName,
    phone_model: `${data.brand} ${data.model}`,
    imei: data.imei,
    city: data.address.city,
    report_type: data.reportType,
    ref_id: data.refId,
    whatsapp: data.whatsappNumber,
    submission_date: (() => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    })(),
  };

  console.log('EmailJS Params:', templateParams);
  
  try {
    const result = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    console.log('EmailJS Success:', result.status, result.text);
    return result;
  } catch (error) {
    console.error('EmailJS Error:', error);
    throw error;
  }
};

export interface ErrorAlertData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  userEmail?: string;
  userId?: string;
  additionalContext?: string;
}

export const sendErrorAlertEmail = async (data: ErrorAlertData) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_ERROR_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const adminEmail = 'sheikhnayab@gmail.com';

  console.log('--- EmailJS Error Alert Debug Info ---');
  console.log('Service ID:', serviceId ? 'Present' : 'MISSING');
  console.log('Template ID (Error):', templateId ? 'Present' : 'MISSING');
  console.log('Public Key:', publicKey ? 'Present' : 'MISSING');

  if (!serviceId || !templateId || !publicKey) {
    console.error('EmailJS system environment variables are not loaded; skipping remote error email dispatch.');
    return;
  }

  const templateParams = {
    to_email: adminEmail,
    // Custom error fields for a modern dedicated error template
    error_type: data.errorType,
    error_message: data.errorMessage,
    error_stack: data.errorStack || 'N/A',
    user_email: data.userEmail || 'Guest / Unauthenticated',
    user_id: data.userId || 'Guest',
    additional_context: data.additionalContext || 'None',
    timestamp: new Date().toISOString(),

    // Fallback translation mappings if they reuse their existing template (VITE_EMAILJS_TEMPLATE_ID)
    owner_name: `🚨 SYSTEM ERROR ALERT: ${data.errorType.substring(0, 30)}`,
    phone_model: `Msg: ${data.errorMessage.substring(0, 80)}`,
    imei: `Context: ${data.additionalContext?.substring(0, 100) || 'Check consoles'}`,
    city: `User: ${data.userEmail || 'Guest'}`,
    report_type: 'SYSTEM_ERROR',
    ref_id: `Stack: ${data.errorStack?.substring(0, 100) || 'N/A'}`,
    whatsapp: 'Error Tracking System',
    submission_date: (() => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    })(),
  };

  try {
    const result = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    console.log('✅ Error Alert Email Dispatched Successfully:', result.status);
    return result;
  } catch (error) {
    console.error('❌ Failed to route error alert email remotely:', error);
  }
};

