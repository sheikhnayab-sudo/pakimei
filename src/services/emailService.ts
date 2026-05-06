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
    submission_date: new Date().toLocaleDateString('en-PK'),
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
