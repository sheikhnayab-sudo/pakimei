
export const PAKISTANI_CITIES = [
  "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", 
  "Peshawar", "Multan", "Hyderabad", "Islamabad", "Quetta", 
  "Bahawalpur", "Sargodha", "Sialkot", "Sukkur", "Larkana", 
  "Sheikhupura", "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", 
  "Gujrat", "Sahiwal", "Wah Cantonment", "Mardan", "Kasur", 
  "Okara", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kāmoke", 
  "Hafizabad", "Sadiqabad", "Mirpur Khas", "Burewala", "Kohat", 
  "Khanewal", "Dera Ismail Khan", "Turbat", "Muzaffargarh", "Abbotabad", 
  "Mandi Bahauddin", "Shikarpur", "Jacobabad", "Jhelum", "Khanpur", 
  "Khairpur", "Khuzdar", "Pakpattan", "Hub", "Daska", "Gojra", 
  "Dadu", "Muridke", "Bahawalnagar", "Samundri", "Tando Allahyar", 
  "Tando Adam", "Jaranwala", "Chishtian", "Muzaffarabad", "Attock", 
  "Vehari", "Kot Abdul Malik", "Ferozewala", "Chakwal", "Guiranwala Cantonment", 
  "Kamalia", "Umerkot", "Ahmedpur East", "Kot Addu", "Wazirabad", 
  "Mansehra", "Layyah", "Mirpur", "Swabi", "Chaman", "Taxila", 
  "Nowshera", "Khushab", "Shahdadkot", "Mianwali", "Kabal", "Lodhran", 
  "Hasilpur", "Charsadda", "Bhakkur", "Badin", "Arif Wala", "Ghotki", 
  "Sambrial", "Jatoī Shimali", "Daharki", "Narowal", "Tando Muḥammad Khan", 
  "Kamber Ali Khan", "Mirpur Mathelo", "Kandhkot", "Bhalwal"
].sort();

export const PHONE_BRANDS = [
  "Samsung", "Apple (iPhone)", "Infinix", "Techno", "Vivo", 
  "Oppo", "Realme", "Xiaomi / Redmi", "Nokia", "Motorola", 
  "Google Pixel", "OnePlus", "Huawei", "Honor", "Sony", 
  "LG", "itel", "VGO TEL", "Sparx", "ZTE", "Other"
].sort();

export const formatNIC = (value: string) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 5) return v;
  if (v.length <= 12) return `${v.slice(0, 5)}-${v.slice(5)}`;
  return `${v.slice(0, 5)}-${v.slice(5, 12)}-${v.slice(12, 13)}`;
};

export const validateNIC = (nic: string) => {
  return /^\d{5}-\d{7}-\d{1}$/.test(nic);
};

export const validateIMEI = (imei: string) => {
  return /^\d{15}$/.test(imei);
};

export const formatWhatsAppNumber = (number: string) => {
  if (!number) return '';
  
  // Remove all non-digit characters
  let cleaned = number.replace(/\D/g, '');
  
  // If starts with 0 (e.g., 0315...) -> replace leading 0 with 92
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  
  // If starts with 3 (e.g., 315...) and length is 10 -> prepend 92
  if (cleaned.startsWith('3') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  
  // The goal is to return 923XXXXXXXXX
  return cleaned;
};

export const validateWhatsAppNumber = (number: string) => {
  const cleaned = formatWhatsAppNumber(number);
  // Pakistani mobile numbers are 12 digits starting with 923
  return /^923\d{9}$/.test(cleaned);
};
