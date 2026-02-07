
import React from 'react';
import { Leaf } from 'lucide-react';
import { translations } from '../data/translations';

export const SplashScreen: React.FC<{lang?: 'es'|'en'}> = ({lang = 'es'}) => {
  const t = translations[lang];
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <div className="relative bg-emerald-500 p-6 rounded-3xl shadow-xl shadow-emerald-200 animate-bounce">
          <Leaf className="w-16 h-16 text-white" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight animate-fade-up" style={{animationDelay: '0.2s'}}>
          NutriSnap
        </h1>
        <p className="text-emerald-600 font-medium tracking-wide uppercase text-sm animate-fade-up" style={{animationDelay: '0.4s'}}>
          {t.splash_subtitle}
        </p>
      </div>

      <div className="absolute bottom-10 text-center animate-fade-in" style={{animationDelay: '0.8s'}}>
        <p className="text-xs text-gray-400">Powered by Gemini 3</p>
      </div>
    </div>
  );
};
