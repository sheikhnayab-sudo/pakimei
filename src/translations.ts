export const translations = {
  en: {
    // Navigation
    nav_home: "Home",
    nav_search: "Search IMEI",
    nav_register: "Register Phone",
    nav_how_it_works: "How It Works",
    nav_feed: "Reported Phones",
    nav_contact: "Contact",
    
    // Home / Hero
    hero_title: "Pakistan's National IMEI Registry",
    hero_tagline: "Gumshuda Mobile Phone Dhoondein",
    hero_desc: "PakIMEI is the national security initiative to verify device status. Report stolen phones and verify pre-owned devices instantly.",
    search_placeholder: "Enter 15-digit IMEI number...",
    search_btn: "Verify Now",
    
    // Quick Actions
    action_register_title: "Report Stolen",
    action_register_desc: "Lost your phone? Register it now to prevent unauthorized resale across Pakistan.",
    action_register_btn: "Get Started",
    action_guide_title: "Technician Guide",
    action_guide_desc: "Are you a mobile phone repair technician? Learn how to verify devices before unlocking.",
    action_guide_btn: "Learn More",
    
    // Features
    feat_database_title: "Verified Database",
    feat_database_desc: "Direct access to Pakistan's most comprehensive stolen device registry.",
    feat_search_title: "Quick Search",
    feat_search_desc: "Scan or enter IMEI to instantly know the status of any mobile phone.",
    feat_logs_title: "Activity Logs",
    feat_logs_desc: "Every report is timestamped and verified by our system.",
    
    // Register Page
    reg_title: "Register Theft Report",
    reg_desc: "Provide accurate details to help technicians identify your stolen device.",
    reg_group_owner: "Owner Details",
    reg_group_location: "Incident Details",
    reg_group_device: "Device Details",
    reg_label_name: "Owner Full Name",
    reg_placeholder_name: "Enter your name (Min 3 chars)",
    reg_label_nic: "NIC Number",
    reg_placeholder_nic: "XXXXX-XXXXXXX-X",
    reg_label_contact: "Contact Number",
    reg_placeholder_contact: "03XXXXXXXXX",
    reg_label_whatsapp: "WhatsApp Number",
    reg_same_as_contact: "Same as contact",
    reg_label_address_street: "Street / Gali",
    reg_placeholder_address_street: "House/Gali number",
    reg_label_address_town: "Town / Mohalla",
    reg_placeholder_address_town: "e.g. Orangi, Johar...",
    reg_label_address_city: "City",
    reg_label_date_time: "Loss Date & Time",
    reg_label_loss_location: "Area / Location of loss",
    reg_placeholder_loss_location: "e.g. Bolton Market, Liberty Chowk...",
    reg_label_imei: "IMEI 1 (15-Digits)",
    reg_label_imei2: "IMEI 2 (Optional)",
    reg_label_brand: "Brand",
    reg_label_model: "Model",
    reg_label_color: "Color",
    reg_label_type: "Report Type",
    reg_type_chori: "Chori (Stolen)",
    reg_type_gum: "Gum (Lost)",
    reg_label_desc: "Additional Details",
    reg_placeholder_desc: "Identifying marks, etc...",
    
    // Form Feedback
    reg_submit_btn: "Register Theft Report",
    reg_submitting: "Processing...",
    reg_success: "Theft report registered successfully!",
    reg_error_nic: "Invalid NIC format (XXXXX-XXXXXXX-X)",
    reg_error_imei: "IMEI must be exactly 15 digits",
    reg_error_duplicate_imei: "This IMEI is already registered in our system.",
    reg_error_duplicate_nic: "Maximum reports (2) reached for this NIC.",
    reg_error_rate_limit: "Daily limit reached. Please try again after 24 hours.",
    reg_error_future_date: "Loss date cannot be in the future.",
    reg_error_generic: "Failed to register report. Please try again.",
    reg_error_offline: "Internet connection check karein (Offline)",
    reg_email_success: "Confirmation email sent! ✉️",
    reg_email_error: "Report saved, but confirmation email failed to send.",
    
    // WhatsApp Modal
    wa_title: "WhatsApp Confirmation",
    wa_desc: "Would you like to send a confirmation record to your WhatsApp number?",
    wa_btn_send: "✅ Open WhatsApp",
    wa_btn_skip: "Skip",
    wa_message_template: "✅ *PakIMEI - Entry Confirm*\n\nAssalam-o-Alaikum {name} bhai!\n\nAapka phone PakIMEI database mein register ho gaya hai.\n\n📱 *Phone:* {phone}\n🔢 *IMEI:* {imei}\n📍 *City:* {city}\n🆔 *Ref ID:* #{refId}\n\nAb jab bhi koi unlock technician is IMEI ko search karega, usay aapka number milega aur woh aapse contact karega.\n\nWebsite: {url}",
    
    // Search Page
    search_result_title: "IMEI Search Result",
    search_back: "Back to Home",
    search_scanning: "Scanning database servers...",
    search_status_stolen: "STOLEN DEVICE",
    search_status_clear: "CLEAR STATUS",
    search_reported_on: "Reported on",
    search_device_info: "Device Info",
    search_last_location: "Reporting Center",
    search_warning_tech: "WARNING FOR TECHNICIANS: This device is blacklisted. Unlocking or software modification of stolen devices is a punishable offense under Pakistani law. Report this device to local authorities immediately.",
    search_clear_msg: "This IMEI currently has NO STOLEN REPORTS. Technicians can safely proceed with repairs.",
    search_empty_msg: "Enter a valid 15-digit IMEI number above to check its status.",
    
    // Footer
    footer_copy: "© {year} PakIMEI - Securing Pakistan's Mobile Devices.",
    footer_sub: "Not affiliated with PTA. Community-driven report registry.",
    
    // Auth
    auth_login: "Login with Google",
    auth_logout: "Logout",
    auth_guest_prompt: "Please login with Google to register a phone report.",
    auth_continue_guest: "Continue as Guest",
    
    // How It Works
    how_step1_title: "Report Theft",
    how_step1_desc: "Owner registers the stolen phone with IMEI, police report number, and contact details.",
    how_step2_title: "Database Registry",
    how_step2_desc: "Our system adds the device to the blacklist. This data is synced across major tech hubs.",
    how_step3_title: "Technician Verification",
    how_step3_desc: "Before repairing or unlocking, technicians search the IMEI on PakIMEI.",
    how_step4_title: "Recovery Path",
    how_step4_desc: "If a match is found, technicians can notify the owner or local authorities.",
    how_legal_title: "Legal Notice",
    how_legal_desc: "According to the Prevention of Electronic Crimes Act (PECA) 2016, modifying registration information or tampering with IMEI is a severe criminal offense. PakIMEI works as a community-driven database.",
    
    // Feed Page
    feed_title: "📋 Reported Phones — Pakistan",
    feed_subtitle: "These entries have been registered by users across the country.",
    feed_login_prompt: "Log in with Google to see full owner details and contact information.",
    feed_empty: "No entries yet. Be the first to register a found or stolen device!",
    feed_load_more: "Load More",
    feed_registered_by: "Registered by",
    feed_loss_date: "Date of Incident",
    feed_imei_masked: "IMEI Masked",
    feed_badge_new: "New"
  },
  ur: {
    // Navigation
    nav_home: "Home",
    nav_search: "IMEI Search",
    nav_register: "Phone Register Karein",
    nav_how_it_works: "Kaam Kaise Karta Hai",
    nav_feed: "Tamaam Entries",
    nav_contact: "Rabta",
    
    // Home / Hero
    hero_title: "Pakistan Ka National IMEI Registry",
    hero_tagline: "Gumshuda Mobile Phone Dhoondein",
    hero_desc: "PakIMEI mobile phone verify karne ka qoumi idara hai. Chori shuda phone report karein aur khareedne se pehle check karein.",
    search_placeholder: "15-hindo ka IMEI number likhein...",
    search_btn: "Abhi Check Karein",
    
    // Quick Actions
    action_register_title: "Chori Report Karein",
    action_register_desc: "Kya apka phone chori hogaya hai? Abhi register karein takay koi isay Pakistan mein bech na sakay.",
    action_register_btn: "Shuru Karein",
    action_guide_title: "Technician Guide",
    action_guide_desc: "Kya aap mobile repair technician hain? Unlock karne se pehle phone check karna seekhein.",
    action_guide_btn: "Mazeed Janiye",
    
    // Features
    feat_database_title: "Verified Database",
    feat_database_desc: "Pakistan ke sab se baray stolen device record tak pohonch.",
    feat_search_title: "Fori Search",
    feat_search_desc: "IMEI likhein aur foran phone ka status maloom karein.",
    feat_logs_title: "Activity Logs",
    feat_logs_desc: "Har report hamaray system se verify aur timestamp ki jati hai.",
    
    // Register Page
    reg_title: "Chori Ki Report Darj Karein",
    reg_desc: "Sahi tafseelat dein takay technician apka phone pehchan sakein.",
    reg_group_owner: "Maalik Ki Tafseel",
    reg_group_location: "Waqiye Ki Tafseel",
    reg_group_device: "Phone Ki Tafseel",
    reg_label_name: "Maalik Ka Pura Naam",
    reg_placeholder_name: "Apna naam likhein (Kam az kam 3 huroof)",
    reg_label_nic: "NIC Number",
    reg_placeholder_nic: "XXXXX-XXXXXXX-X",
    reg_label_contact: "Rabta Number",
    reg_placeholder_contact: "03XXXXXXXXX",
    reg_label_whatsapp: "WhatsApp Number",
    reg_same_as_contact: "Rabta number jaisa",
    reg_label_address_street: "Gali / Street",
    reg_placeholder_address_street: "Ghar ya gali number",
    reg_label_address_town: "Town / Mohalla",
    reg_placeholder_address_town: "Maslan Orangi, Johar...",
    reg_label_address_city: "Shehar",
    reg_label_date_time: "Waqiye Ka Din aur Waqt",
    reg_label_loss_location: "Waqiye Ki Jagah / Ilaqa",
    reg_placeholder_loss_location: "Maslan Bolton Market, Liberty Chowk...",
    reg_label_imei: "IMEI 1 (15-Hinde)",
    reg_label_imei2: "IMEI 2 (Ikhtiyari)",
    reg_label_brand: "Brand",
    reg_label_model: "Model",
    reg_label_color: "Rang (Color)",
    reg_label_type: "Report Ki Qism",
    reg_type_chori: "Chori (Stolen)",
    reg_type_gum: "Gum (Lost)",
    reg_label_desc: "Mazeed Tafseelat",
    reg_placeholder_desc: "Koi makhsoos nishani, waghaira...",
    
    // Form Feedback
    reg_submit_btn: "Report Darj Karein",
    reg_submitting: "Processing...",
    reg_success: "Chori ki report kamyabi se darj hogayi!",
    reg_error_nic: "NIC format ghalat hai (XXXXX-XXXXXXX-X)",
    reg_error_imei: "IMEI pure 15 hindo ka hona chahiye",
    reg_error_duplicate_imei: "Yeh IMEI pehle se hamaray system mein darj hai.",
    reg_error_duplicate_nic: "Is NIC se pehle hi 2 reports darj hain.",
    reg_error_rate_limit: "Aaj ki limit khatam hogayi. 24 ghantay baad koshish karein.",
    reg_error_future_date: "Waqiye ki tareekh mustaqbil ki nahi hosakti.",
    reg_error_generic: "Report darj nahi hosaki. Dubara koshish karein.",
    reg_error_offline: "Internet connection check karein (Offline)",
    reg_email_success: "Tasdeeqi email bhej di gayi hai! ✉️",
    reg_email_error: "Report darj hogayi hai, lekin tasdeeqi email nahi bheji jasaki.",
    
    // WhatsApp Modal
    wa_title: "WhatsApp Tasdeeq",
    wa_desc: "Kya aap apnay WhatsApp number par tasdeeqi message bhejna chahte hain?",
    wa_btn_send: "✅ WhatsApp Kholein",
    wa_btn_skip: "Skip",
    wa_message_template: "✅ *PakIMEI - Entry Confirm*\n\nAssalam-o-Alaikum {name} bhai!\n\nAapka phone PakIMEI database mein register ho gaya hai.\n\n📱 *Phone:* {phone}\n🔢 *IMEI:* {imei}\n📍 *City:* {city}\n🆔 *Ref ID:* #{refId}\n\nAb jab bhi koi unlock technician is IMEI ko search karega, usay aapka number milega aur woh aapse contact karega.\n\nWebsite: {url}",
    
    // Search Page
    search_result_title: "IMEI Search Ka Natija",
    search_back: "Wapis Home Per",
    search_scanning: "Database check ho raha hai...",
    search_status_stolen: "CHORI SHUDA PHONE",
    search_status_clear: "STATUS CLEAR HAI",
    search_reported_on: "Report ki tareekh",
    search_device_info: "Phone Ki Tafseel",
    search_last_location: "Reporting Center",
    search_warning_tech: "TECHNICIANS KE LIYE WARNING: Yeh device blacklisted hai. Chori shuda phone unlock karna jurm hai. Foran mutalqa hukkam ko batiye.",
    search_clear_msg: "Is IMEI ka koi chori ka record nahi mila. Technician repair jari rakh saktay hain.",
    search_empty_msg: "Upar 15-hindo ka IMEI likh kar check karein.",
    
    // Footer
    footer_copy: "© {year} PakIMEI - Pakistan ke mobile mehfooz banayein.",
    footer_sub: "PTA se munsalik nahi. Yeh aik community registry hai.",
    
    // Auth
    auth_login: "Google se Login Karein",
    auth_logout: "Logout",
    auth_guest_prompt: "Phone report register karne ke liye Google se login karein.",
    auth_continue_guest: "Guest ke taur par jari rakhein",
    
    // How It Works
    how_step1_title: "Chori Report Karein",
    how_step1_desc: "Phone ka maalik IMEI aur contact details ke saath report darj karta hai.",
    how_step2_title: "Database Registry",
    how_step2_desc: "Hamaray system mein phone blacklist hojata hai aur Pakistan ke tech hubs mein sync hojata hai.",
    how_step3_title: "Technician Verification",
    how_step3_desc: "Repair ya unlock karne se pehle technician PakIMEI per phone check karta hai.",
    how_step4_title: "Recovery Ka Rasta",
    how_step4_desc: "Record milnay per technician asli maalik ya mutalqa hukkam ko khabar karta hai.",
    how_legal_title: "Legal Notice",
    how_legal_desc: "PECA Act 2016 ke mutabiq IMEI tampering aik sangeen jurm hai. PakIMEI hukkam ki madad ke liye aik database faraham karta hai.",
    
    // Feed Page
    feed_title: "📋 Reported Phones — Pakistan",
    feed_subtitle: "In tamaam phones ki entries registered users ne ki hain.",
    feed_login_prompt: "Puri details dekhne ke liye Login karein.",
    feed_empty: "Abhi tak koi entry nahi hui. Pehle register karne wale banein!",
    feed_load_more: "Mazeed Dikhein",
    feed_registered_by: "Registered by",
    feed_loss_date: "Chori ki Tarikh",
    feed_imei_masked: "IMEI Masked",
    feed_badge_new: "New"
  }
};
