
import React, { useEffect } from 'react';
import { Leaf, CheckCircle } from 'lucide-react';
import { translations } from '../data/translations';

interface LoginScreenProps {
  onLoginSuccess: (credential: string) => void;
  lang?: 'es' | 'en';
}

// Declare global window property for Google
declare global {
  interface Window {
    google: any;
  }
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, lang = 'es' }) => {
  const t = translations[lang];

  useEffect(() => {
    /* 
      IMPORTANTE: Debes reemplazar 'YOUR_GOOGLE_CLIENT_ID_HERE' con tu propio 
      Client ID de Google Cloud Console.
    */
    const GOOGLE_CLIENT_ID = "738932582742-qtejr7a73iudphk38ck9qfv4gvmfl44u.apps.googleusercontent.com"; 

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          onLoginSuccess(response.credential);
        }
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: "100%", text: "continue_with" }
      );
    }
  }, [onLoginSuccess]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-50 rounded-b-[40px] -z-10 overflow-hidden">
         <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-100 rounded-full opacity-50 blur-3xl"></div>
         <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-blue-100 rounded-full opacity-50 blur-2xl"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto">
        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-emerald-100 mb-8 animate-bounce">
          <Leaf className="w-12 h-12 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-2">NutriSnap</h1>
        <p className="text-gray-500 text-center mb-10">{t.login_subtitle}</p>

        <div className="w-full space-y-4 mb-12">
            <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl border border-gray-100">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">{t.login_feature1}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl border border-gray-100">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">{t.login_feature2}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl border border-gray-100">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">{t.login_feature3}</span>
            </div>
        </div>

        <div className="w-full">
            <p className="text-xs text-center text-gray-400 mb-4 font-bold uppercase tracking-wider">{t.login_cta}</p>
            <div id="googleBtn" className="w-full flex justify-center h-[44px]"></div>
            
            {/* Fallback visual if JS hasn't loaded or Client ID missing */}
            <div className="mt-4 text-[10px] text-gray-300 text-center px-4">
              {t.login_fallback}
            </div>
        </div>
      </div>
      
      <div className="p-6 text-center">
        <p className="text-xs text-gray-400">Powered by Gemini 3</p>
      </div>
    </div>
  );
};
