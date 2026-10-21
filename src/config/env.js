// App settings. Override per build with EXPO_PUBLIC_* variables (e.g. in .env or eas.json):
//   EXPO_PUBLIC_API_URL=https://api.example.com/
//   EXPO_PUBLIC_PATIENT_ACCESS_KEY=...
// Note: anything shipped in the app can be read by users, so the access key is not a secret.

const trimSlash = (url) => (url.endsWith('/') ? url : `${url}/`);

export const API_URL = trimSlash(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/');

// Sent with the patient login request; the backend currently requires it.
export const PATIENT_ACCESS_KEY = process.env.EXPO_PUBLIC_PATIENT_ACCESS_KEY || 'whjxEIDSMvrpF5p';

// Log the patient out after this many minutes away from the app (default 7 days).
export const INACTIVITY_LOGOUT_MINUTES = Number(process.env.EXPO_PUBLIC_INACTIVITY_LOGOUT_MINUTES || 7 * 24 * 60);

// Clinic contact shown in the app (same as the website).
export const CLINIC = {
  name: { hi: 'आनंदकिरण', en: 'Anandkiran' },
  phone: '+91 79062 88878',
  phoneHref: 'tel:+917906288878',
  whatsappHref: 'https://wa.me/917906288878',
  email: 'info@arogyapath.org',
  website: 'https://arogyapath.in/',
  bookingUrl: 'https://arogyapath.in/appointments',
};
