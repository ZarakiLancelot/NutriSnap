import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Analytics } from "@firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBiu9BFi0owW7mpgskfTyk4nJ533vg0VY4",
  authDomain: "nutrisnap-23dbd.firebaseapp.com",
  projectId: "nutrisnap-23dbd",
  storageBucket: "nutrisnap-23dbd.firebasestorage.app",
  messagingSenderId: "911345240896",
  appId: "1:911345240896:web:6bc82a3c764dbae24788a5",
  measurementId: "G-T19C5EEXGB"
};

// Singleton pattern to avoid double initialization in React
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Analytics is optional and only works in secure environments
let analytics: Analytics;
if (typeof window !== 'undefined') {
    isSupported().then((yes) => {
        if (yes) {
            analytics = getAnalytics(app);
        }
    }).catch((err) => {
        console.warn("Analytics no pudo iniciarse (posiblemente por bloqueador de anuncios o entorno local).");
    });
}

export { db, app, analytics };