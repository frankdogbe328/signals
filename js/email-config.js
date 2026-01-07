// EmailJS Configuration
// Get these values from https://www.emailjs.com/
// 
// Setup Instructions:
// 1. Go to https://www.emailjs.com/ and sign up (free)
// 2. Add an email service (Gmail, Outlook, etc.)
// 3. Create an email template
// 4. Get your Public Key (User ID) from Account → General
// 5. Get Service ID from your email service
// 6. Get Template ID from your email template
// 7. Add them below

window.EMAILJS_CONFIG = {
    // Your EmailJS Public Key (User ID)
    PUBLIC_KEY: 'Ty9vLZOIvabQ9tnvG',
    
    // Your EmailJS Service ID
    SERVICE_ID: 'service_du0l5sv',
    
    // Your EmailJS Template ID
    TEMPLATE_ID: 'template_8b16l8p'
};

// Load EmailJS library if configured
if (window.EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY_HERE') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = function() {
        emailjs.init(window.EMAILJS_CONFIG.PUBLIC_KEY);
        console.log('EmailJS initialized');
    };
    document.head.appendChild(script);
} else {
    console.log('EmailJS not configured. Email sending will be disabled.');
}

