
import React, { useState, useEffect } from 'react';
import { UserProfile, AvatarArchetype, Language, Currency } from '../types';
import { X, User, Activity, Droplet, Moon, Calculator, Save, ChevronDown, Flag, Calendar, Target, Check, Dumbbell, Timer, Medal, Lock, Star, Zap, Search, Scale, Flame, Coins, Link, Swords } from 'lucide-react';
import { BADGES } from '../services/gamificationService';
import { translations } from '../data/translations';
import { GoogleFitService } from '../services/googleFitService';
import { SocialDuel } from './SocialDuel';
import { jwtDecode } from "jwt-decode";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  lang: Language;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  heightCm: 170,
  weightKg: 70,
  startWeight: 0, 
  age: 30,
  gender: 'male',
  currency: 'USD',
  sleepHours: 7,
  waterGlasses: 4,
  exerciseDays: 3,
  exerciseType: 'Caminata',
  exerciseAmount: 30,
  exerciseUnit: 'min',
  targetWeightKg: 65,
  goalWeeks: 12,
  isDieting: true,
  enableNotifications: false,
  googleFitSync: false,
  avatarArchetype: 'bear',
  gamification: {
    xp: 0,
    level: 1,
    unlockedBadges: [],
    totalFoodLogs: 0,
    totalWaterLogs: 0,
    totalExerciseLogs: 0
  }
};

const CURRENCIES: { code: Currency, label: string }[] = [
    { code: 'GTQ', label: 'Quetzal (Q)' },
    { code: 'USD', label: 'Dólar (USD)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'MXN', label: 'Peso Mexicano ($)' },
    { code: 'COP', label: 'Peso Colombiano ($)' },
    { code: 'ARS', label: 'Peso Argentino ($)' },
    { code: 'CLP', label: 'Peso Chileno ($)' },
    { code: 'PEN', label: 'Sol Peruano (S/)' },
    { code: 'UYU', label: 'Peso Uruguayo ($)' },
    { code: 'DOP', label: 'Peso Dominicano ($)' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, initialProfile, onSave, lang = 'es' }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile || DEFAULT_PROFILE);
  const [bmi, setBmi] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'info' | 'goals' | 'badges' | 'social'>('info');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const t = translations[lang];

  // Helper to map exercise type to translation
  const getExerciseLabel = (key: string) => {
      switch(key) {
          case 'Caminata': return t.ex_walking;
          case 'Correr': return t.ex_running;
          case 'Ciclismo': return t.ex_cycling;
          case 'Natación': return t.ex_swimming;
          case 'Senderismo': return t.ex_hiking;
          case 'Baile': return t.ex_dancing;
          case 'Entrenamiento de Fuerza': return t.ex_strength;
          case 'Gimnasio / Pesas': return t.ex_gym;
          case 'Yoga / Pilates': return t.ex_yoga;
          case 'Crossfit / HIIT': return t.ex_hiit;
          case 'Deportes (Fútbol, etc)': return t.ex_sports;
          case 'Artes Marciales': return t.ex_martial;
          case 'Escalada': return t.ex_climbing;
          default: return key;
      }
  };

  const EXERCISE_TYPES_CONFIG = [
    { label: 'Caminata', units: ['min', 'km'] },
    { label: 'Correr', units: ['min', 'km'] },
    { label: 'Ciclismo', units: ['min', 'km'] },
    { label: 'Natación', units: ['min', 'm'] },
    { label: 'Senderismo', units: ['min', 'km'] },
    { label: 'Baile', units: ['min'] },
    { label: 'Entrenamiento de Fuerza', units: ['min'] },
    { label: 'Gimnasio / Pesas', units: ['min'] },
    { label: 'Yoga / Pilates', units: ['min'] },
    { label: 'Crossfit / HIIT', units: ['min'] },
    { label: 'Deportes (Fútbol, etc)', units: ['min'] },
    { label: 'Artes Marciales', units: ['min'] },
    { label: 'Escalada', units: ['min'] }
  ];

  useEffect(() => {
    if (initialProfile) {
      setProfile({ ...DEFAULT_PROFILE, ...initialProfile });
    }
    const token = localStorage.getItem('nutrisnap_token');
    if (token) {
        try {
            const decoded: any = jwtDecode(token);
            setCurrentUserId(decoded.sub || decoded.email);
        } catch(e) {}
    }
  }, [initialProfile]);

  useEffect(() => {
    if (profile.heightCm > 0 && profile.weightKg > 0) {
      const heightM = profile.heightCm / 100;
      const calculatedBmi = profile.weightKg / (heightM * heightM);
      setBmi(parseFloat(calculatedBmi.toFixed(1)));
    }
  }, [profile.heightCm, profile.weightKg]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'gender' || name === 'currency' || name === 'exerciseType' || name === 'exerciseUnit' || name === 'name' ? value : Number(value))
    }));
  };

  const handleExerciseTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value;
      const typeConfig = EXERCISE_TYPES_CONFIG.find(t => t.label === newType);
      setProfile(prev => ({
          ...prev,
          exerciseType: newType,
          exerciseUnit: typeConfig?.units.includes('km') ? 'km' : 'min'
      }));
  };

  const determineArchetype = (currentProfile: UserProfile, currentBmi: number): AvatarArchetype => {
      if (currentProfile.exerciseDays >= 5 || ['Correr', 'Crossfit / HIIT', 'Deportes (Fútbol, etc)', 'Artes Marciales'].includes(currentProfile.exerciseType)) {
          return 'tiger';
      }
      if (currentBmi > 27) return 'bear';
      if (currentBmi < 20) return 'fox';
      if (currentProfile.sleepHours > 9 || currentProfile.exerciseDays <= 1) return 'koala';
      return 'fox';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'info') {
        setActiveTab('goals');
    } else {
        const finalProfile = { ...profile };
        if (finalProfile.startWeight === 0 || (!initialProfile?.startWeight && finalProfile.startWeight === 70)) {
            finalProfile.startWeight = finalProfile.weightKg;
        }
        const h = finalProfile.heightCm / 100;
        const b = finalProfile.weightKg / (h*h);
        finalProfile.avatarArchetype = determineArchetype(finalProfile, b);
        onSave(finalProfile);
        onClose();
    }
  };

  const handleConnectGoogleFit = async () => {
    if (!profile.googleFitSync) {
        const result = await GoogleFitService.connect();
        if (result.success) {
            setProfile(prev => ({ ...prev, googleFitSync: true }));
        } else {
            alert(`${t.google_fit_error}\n\nDetails: ${result.error}`);
        }
    } else {
        setProfile(prev => ({ ...prev, googleFitSync: false }));
    }
  };

  const getBmiColor = (val: number) => {
    if (val < 18.5) return 'text-blue-500';
    if (val < 25) return 'text-emerald-500';
    if (val < 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getBadgeIcon = (iconName: string) => {
    switch(iconName) {
        case 'Search': return <Search className="w-6 h-6" />;
        case 'Flame': return <Flame className="w-6 h-6" />;
        case 'Zap': return <Zap className="w-6 h-6" />;
        case 'Droplet': return <Droplet className="w-6 h-6" />;
        case 'Dumbbell': return <Dumbbell className="w-6 h-6" />;
        case 'Scale': return <Scale className="w-6 h-6" />;
        default: return <Star className="w-6 h-6" />;
    }
  };

  const currentExerciseConfig = EXERCISE_TYPES_CONFIG.find(t => t.label === profile.exerciseType) || EXERCISE_TYPES_CONFIG[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 animate-fade-in flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center z-20">
          <div><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><User className="w-5 h-5 text-emerald-500" /> {t.profile_title}</h2><p className="text-xs text-gray-400 mt-0.5">{t.profile_subtitle}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group"><X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" /></button>
        </div>

        <div className="flex px-6 pt-4 gap-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
           <button onClick={() => setActiveTab('info')} className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'info' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{t.profile_tab_info}</button>
           <button onClick={() => setActiveTab('goals')} className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'goals' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{t.profile_tab_goals}</button>
           <button onClick={() => setActiveTab('badges')} className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'badges' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{t.profile_tab_badges}</button>
           <button onClick={() => setActiveTab('social')} className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${activeTab === 'social' ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><Swords className="w-3 h-3" /> {t.profile_tab_social}</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 min-h-[400px] bg-white">
          {activeTab === 'info' && (
            <>
              <section className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4"><div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Calculator className="w-4 h-4" /></div><h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t.profile_tab_info}</h3></div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-200 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-full h-1 ${getBmiColor(bmi).replace('text-', 'bg-')}`}></div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">BMI</span>
                      <div className={`text-5xl font-black mb-2 tracking-tight ${getBmiColor(bmi)}`}>{bmi}</div>
                  </div>
                  <div className="md:w-2/3 grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.profile_name}</label><input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" /></div>
                        
                        <div className="col-span-2 space-y-1 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.profile_currency}</label>
                            <div className="relative">
                                <select name="currency" value={profile.currency || 'USD'} onChange={handleChange} className="w-full pl-10 pr-8 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                                    {CURRENCIES.map(curr => (
                                        <option key={curr.code} value={curr.code}>{curr.label}</option>
                                    ))}
                                </select>
                                <Coins className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.profile_height}</label><div className="relative"><input type="number" inputMode="numeric" name="heightCm" value={profile.heightCm || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full pl-3 pr-8 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" min="50" max="250" /><span className="absolute right-3 top-3 text-sm text-gray-400 font-medium">cm</span></div></div>
                        <div className="space-y-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.profile_weight}</label><div className="relative"><input type="number" inputMode="decimal" name="weightKg" value={profile.weightKg || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full pl-3 pr-8 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" min="20" max="300" /><span className="absolute right-3 top-3 text-sm text-gray-400 font-medium">kg</span></div></div>
                        <div className="space-y-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.profile_age}</label><input type="number" inputMode="numeric" name="age" value={profile.age || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" min="10" max="120" /></div>
                        <div className="space-y-1 relative"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{t.profile_gender}</label><div className="relative"><select name="gender" value={profile.gender} onChange={handleChange} className="w-full pl-3 pr-8 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"><option value="male">{t.profile_gender_m}</option><option value="female">{t.profile_gender_f}</option><option value="other">{t.profile_gender_o}</option></select><ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                  </div>
                </div>
              </section>
              <section className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4"><div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Activity className="w-4 h-4" /></div><h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t.profile_lifestyle}</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 transition-all flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg"><Moon className="w-5 h-5" /></div><span className="font-bold text-gray-700">{t.profile_sleep}</span></div><div className="flex items-end gap-2"><input type="number" inputMode="decimal" name="sleepHours" value={profile.sleepHours || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-16 text-xl font-bold bg-transparent border-b border-indigo-100 focus:border-indigo-500 outline-none text-gray-800 text-right" min="0" max="24" /><span className="text-xs text-gray-400 font-medium mb-1">h</span></div></div>
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Droplet className="w-5 h-5" /></div><span className="font-bold text-gray-700">{t.profile_water}</span></div><div className="flex items-end gap-2"><input type="number" inputMode="numeric" name="waterGlasses" value={profile.waterGlasses || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-16 text-xl font-bold bg-transparent border-b border-blue-100 focus:border-blue-500 outline-none text-gray-800 text-right" min="0" /></div></div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-8 animate-fade-in">
                <section>
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                        <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-6"><Target className="w-5 h-5 text-indigo-600" /> {t.profile_tab_goals}</h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">{t.profile_goal_weight}</label><div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-4"><input type="number" inputMode="decimal" name="targetWeightKg" value={profile.targetWeightKg || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="text-3xl font-black text-indigo-900 w-full outline-none bg-transparent" /></div></div>
                            <div className="flex-1 space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">{t.profile_goal_weeks}</label><div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-4"><input type="number" inputMode="numeric" name="goalWeeks" value={profile.goalWeeks || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="text-3xl font-black text-indigo-900 w-full outline-none bg-transparent" min="1" max="52" /><Calendar className="w-6 h-6 text-indigo-200" /></div></div>
                        </div>
                    </div>
                </section>
                <section>
                    <h3 className="text-gray-800 font-bold flex items-center gap-2 mb-4"><Flag className="w-5 h-5 text-emerald-500" /> {t.profile_commitments}</h3>
                    <div className="space-y-4">
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
                             <div className="flex items-center gap-3 mb-4"><div className="bg-orange-50 p-2 rounded-lg"><Dumbbell className="w-5 h-5 text-orange-500" /></div><span className="font-bold text-gray-800 text-lg">{t.profile_fitness_header}</span></div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">{t.profile_exercise_type}</label><div className="relative"><select name="exerciseType" value={profile.exerciseType} onChange={handleExerciseTypeChange} className="w-full pl-3 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium appearance-none outline-none focus:ring-2 focus:ring-emerald-500">{EXERCISE_TYPES_CONFIG.map(type => (<option key={type.label} value={type.label}>{getExerciseLabel(type.label)}</option>))}</select><ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                                 <div className="flex gap-3">
                                     <div className="space-y-1 flex-1"><label className="text-xs font-bold text-gray-500 uppercase">{t.profile_exercise_freq}</label><div className="relative"><input type="number" inputMode="numeric" name="exerciseDays" value={profile.exerciseDays || ''} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full py-3 pl-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500" min="0" max="7" /></div></div>
                                     <div className="space-y-1 flex-1"><label className="text-xs font-bold text-gray-500 uppercase">{t.profile_exercise_amount}</label><div className="flex"><input type="number" inputMode="numeric" name="exerciseAmount" value={profile.exerciseAmount || 0} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full py-3 pl-3 bg-gray-50 border border-gray-200 rounded-l-xl text-gray-800 font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500 border-r-0" min="0" /><select name="exerciseUnit" value={profile.exerciseUnit} onChange={handleChange} className="bg-gray-100 border border-gray-200 rounded-r-xl px-2 text-sm text-gray-600 font-medium outline-none focus:ring-2 focus:ring-emerald-500">{currentExerciseConfig.units.map(u => (<option key={u} value={u}>{u}</option>))}</select></div></div>
                                 </div>
                             </div>
                        </div>
                        <label className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group shadow-sm">
                            <div className="relative"><input type="checkbox" name="isDieting" checked={profile.isDieting} onChange={handleChange} className="peer sr-only" /><div className="w-7 h-7 bg-white border-2 border-gray-300 rounded-lg peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center"><Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} /></div></div>
                            <div className="flex-1"><span className="text-lg font-bold text-gray-800 block group-hover:text-emerald-800 transition-colors">{t.profile_diet_check}</span><span className="text-sm text-gray-500 block mt-1">{t.profile_diet_sub}</span></div>
                        </label>
                    </div>
                </section>
                <section>
                    <h3 className="text-gray-800 font-bold flex items-center gap-2 mb-4"><Link className="w-5 h-5 text-blue-500" /> {t.google_fit_title}</h3>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                         <div>
                             <p className="font-bold text-gray-800">{t.google_fit_desc}</p>
                             <p className="text-xs text-gray-400 mt-1">{profile.googleFitSync ? t.google_fit_connected : "Sync data automatically"}</p>
                         </div>
                         <button 
                             type="button" 
                             onClick={handleConnectGoogleFit} 
                             className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${profile.googleFitSync ? 'bg-green-100 text-green-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                         >
                             {profile.googleFitSync ? t.google_fit_connected : t.google_fit_btn}
                         </button>
                    </div>
                </section>
            </div>
          )}

          {activeTab === 'badges' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between"><h3 className="text-gray-800 font-bold flex items-center gap-2"><Medal className="w-5 h-5 text-yellow-500" /> {t.profile_tab_badges}</h3><div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">{profile.gamification?.unlockedBadges.length || 0} / {BADGES.length}</div></div>
                  <div className="grid grid-cols-2 gap-4">
                      {BADGES.map(badge => {
                          const isUnlocked = profile.gamification?.unlockedBadges.includes(badge.id);
                          const badgeNameKey = `badge_${badge.id}_name`;
                          const badgeDescKey = `badge_${badge.id}_desc`;
                          // @ts-ignore
                          const badgeName = t[badgeNameKey] || badge.name;
                          // @ts-ignore
                          const badgeDesc = t[badgeDescKey] || badge.description;

                          return (
                              <div key={badge.id} className={`p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all ${isUnlocked ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100 bg-gray-50 opacity-60 grayscale'}`}>
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${isUnlocked ? 'bg-white shadow-md text-yellow-500' : 'bg-gray-200 text-gray-400'}`}>{isUnlocked ? getBadgeIcon(badge.icon) : <Lock className="w-5 h-5" />}</div>
                                  <h4 className="font-bold text-gray-800 text-sm">{badgeName}</h4>
                                  <p className="text-xs text-gray-500 leading-tight">{badgeDesc}</p>
                                  {isUnlocked && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">+{badge.xpReward} XP</span>}
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {activeTab === 'social' && (
              <SocialDuel 
                  profile={profile} 
                  userId={currentUserId}
                  onUpdate={(p) => setProfile(p)}
                  lang={lang}
              />
          )}

          <div className="pt-4 sticky bottom-0 bg-white pb-2 border-t border-gray-50 mt-4">
            <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                {activeTab === 'info' ? t.profile_continue : t.profile_save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
