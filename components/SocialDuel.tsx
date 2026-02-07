
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { translations } from '../data/translations';
import { SocialService } from '../services/socialService';
import { Swords, UserPlus, Check, X, Ghost, Loader2 } from 'lucide-react';

interface SocialDuelProps {
  profile: UserProfile;
  userId: string | null;
  onUpdate: (profile: UserProfile) => void;
  lang: Language;
}

export const SocialDuel: React.FC<SocialDuelProps> = ({ profile, userId, onUpdate, lang = 'es' }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'error'|'success', text: string} | null>(null);
  const t = translations[lang];

  const handleLink = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId || !email) return;
      
      setLoading(true);
      setMsg(null);

      const partner = await SocialService.findUserByEmail(email);
      
      if (partner) {
          if (partner.uid === userId) {
              setMsg({ type: 'error', text: t.social_error_self });
              setLoading(false);
              return;
          }

          const success = await SocialService.linkPartners(userId, partner.uid, partner.name, partner.email!);
          if (success) {
              setMsg({ type: 'success', text: t.social_success_link.replace('{name}', partner.name) });
              onUpdate({
                  ...profile,
                  social: {
                      partnerId: partner.uid,
                      partnerName: partner.name,
                      partnerEmail: partner.email
                  }
              });
          } else {
              setMsg({ type: 'error', text: t.social_error_link });
          }
      } else {
          setMsg({ type: 'error', text: t.social_not_found });
      }
      setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
                    <Swords className="w-6 h-6 text-yellow-300" /> {t.social_title}
                </h3>
                <p className="text-violet-100 text-sm opacity-90">{t.social_subtitle}</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                <Ghost className="w-32 h-32" />
            </div>
        </div>

        {profile.social?.partnerId ? (
            <div className="bg-white border border-violet-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 mb-3">
                    <Swords className="w-8 h-8" />
                </div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{t.social_connected_with}</p>
                <h4 className="text-2xl font-black text-gray-800">{profile.social.partnerName}</h4>
                <p className="text-gray-400 text-sm mb-4">{profile.social.partnerEmail}</p>
                <div className="bg-violet-50 text-violet-700 px-4 py-2 rounded-xl text-xs font-bold border border-violet-200">
                    {t.social_mode_active}
                </div>
            </div>
        ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleLink} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t.social_input_label}</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-gray-400"
                                placeholder="usuario@gmail.com"
                                required
                            />
                            <UserPlus className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    {msg && (
                        <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {msg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            {msg.text}
                        </div>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.social_btn_invite}
                    </button>
                </form>
            </div>
        )}
    </div>
  );
};
