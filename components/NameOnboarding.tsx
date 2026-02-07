
import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { translations } from '../data/translations';

interface NameOnboardingProps {
  onComplete: (name: string) => void;
  lang?: 'es' | 'en';
}

export const NameOnboarding: React.FC<NameOnboardingProps> = ({ onComplete, lang = 'es' }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length === 0) {
      setError(true);
      return;
    }
    onComplete(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[90] bg-white flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Graphic */}
        <div className="mx-auto w-32 h-32 relative">
             <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-indigo-500" />
             </div>
             {/* Simple Boni representation */}
             <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full border-2 border-gray-100 shadow-lg p-2">
                <svg viewBox="0 0 200 220" className="w-full h-full">
                     <path d="M60 110 Q40 20 90 30 L80 110" fill="#cbd5e1" stroke="#334155" strokeWidth="8" />
                     <path d="M140 110 Q160 20 110 30 L120 110" fill="#cbd5e1" stroke="#334155" strokeWidth="8" />
                     <ellipse cx="100" cy="130" rx="60" ry="50" fill="#f1f5f9" stroke="#334155" strokeWidth="8" />
                     <circle cx="80" cy="120" r="8" fill="#1e293b" />
                     <circle cx="120" cy="120" r="8" fill="#1e293b" />
                </svg>
             </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">{t.onboarding_hello}</h2>
          <p className="text-gray-500 text-lg whitespace-pre-line">{t.onboarding_ask_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError(false);
                    }}
                    placeholder={t.onboarding_placeholder}
                    className={`w-full px-6 py-4 text-center text-xl font-bold text-gray-900 rounded-2xl bg-gray-50 border-2 outline-none transition-all placeholder:text-gray-300 placeholder:font-normal ${error ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-indigo-500 focus:bg-white'}`}
                    autoFocus
                />
            </div>
            {error && <p className="text-red-500 text-sm">{t.onboarding_error}</p>}

            <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
                {t.onboarding_btn} <ArrowRight className="w-5 h-5" />
            </button>
        </form>
      </div>
    </div>
  );
};
