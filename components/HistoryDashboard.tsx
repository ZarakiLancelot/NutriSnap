
import React, { useState, useMemo } from 'react';
import { UserProfile, HistoryItem, Language } from '../types';
import { translations } from '../data/translations';
import { X, Calendar, Droplet, Moon, Activity, Utensils, Flame, DollarSign, Smile, Meh, Frown, ThumbsUp, Coffee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';

interface HistoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  history: HistoryItem[];
  lang: Language;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ isOpen, onClose, profile, history, lang = 'es' }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'trends'>('daily');
  const t = translations[lang];

  // Consolidate data for "Daily" view
  const dailyData = useMemo(() => {
      const map = new Map<string, any>();
      
      // 1. Logs from Profile (Water, Sleep, Mood)
      profile.dailyLogs?.forEach(log => {
          map.set(log.date, { 
              ...log,
              foodCount: 0,
              calories: 0 
          });
      });

      // 2. Aggregate Food History
      history.forEach(h => {
          const date = new Date(h.timestamp).toISOString().split('T')[0];
          const existing = map.get(date) || { date, waterGlasses: 0, sleepHours: 0, exerciseMins: 0, mood: 'neutral' };
          existing.foodCount = (existing.foodCount || 0) + 1;
          existing.calories = (existing.calories || 0) + h.calorias.total;
          map.set(date, existing);
      });

      // Convert to array and sort descending
      return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [profile.dailyLogs, history]);

  // Data for "Trends" view (Weekly aggregation)
  const trendsData = useMemo(() => {
      const weeksMap = new Map<string, { week: string, calories: number, savings: number, count: number }>();
      
      history.forEach(h => {
          const d = new Date(h.timestamp);
          // Get start of week
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
          const monday = new Date(d.setDate(diff));
          const weekKey = monday.toISOString().split('T')[0];
          const label = `${monday.getDate()}/${monday.getMonth()+1}`;

          const current = weeksMap.get(weekKey) || { week: label, calories: 0, savings: 0, count: 0 };
          current.calories += h.calorias.total;
          if (h.costo_analisis?.ahorro) {
              current.savings += h.costo_analisis.ahorro;
          }
          current.count += 1;
          weeksMap.set(weekKey, current);
      });

      // Sort by date and take last 8 weeks
      return Array.from(weeksMap.entries())
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
          .map(e => ({
              ...e[1],
              avgCalories: Math.round(e[1].calories / e[1].count) // Avg per meal
          }))
          .slice(-8);
  }, [history]);

  const getMoodConfig = (mood: string) => {
    switch(mood) {
        case 'great': return { icon: <ThumbsUp className="w-3 h-3" />, color: 'text-emerald-600 bg-emerald-100 border-emerald-200', label: t.mood_great };
        case 'good': return { icon: <Smile className="w-3 h-3" />, color: 'text-blue-600 bg-blue-100 border-blue-200', label: t.mood_good };
        case 'neutral': return { icon: <Meh className="w-3 h-3" />, color: 'text-gray-600 bg-gray-100 border-gray-200', label: t.mood_neutral };
        case 'tired': return { icon: <Coffee className="w-3 h-3" />, color: 'text-amber-600 bg-amber-100 border-amber-200', label: t.mood_tired };
        case 'bad': return { icon: <Frown className="w-3 h-3" />, color: 'text-red-600 bg-red-100 border-red-200', label: t.mood_bad };
        default: return { icon: <Meh className="w-3 h-3" />, color: 'text-gray-400 bg-gray-50 border-gray-100', label: '-' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 animate-fade-in flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-20">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> {t.dashboard_title}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-white border-b border-gray-100 justify-center gap-2 shadow-sm z-10">
            <button 
                onClick={() => setActiveTab('daily')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'daily' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                {t.dashboard_daily}
            </button>
            <button 
                onClick={() => setActiveTab('trends')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'trends' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                {t.dashboard_trends}
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
            {activeTab === 'daily' ? (
                <div className="space-y-4">
                    {dailyData.length === 0 && (
                        <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                            <Calendar className="w-12 h-12 mb-2 text-gray-200" />
                            <p>{t.dashboard_no_daily}</p>
                        </div>
                    )}
                    {dailyData.map((day, idx) => {
                        const dateParts = day.date.split('-').map(Number);
                        // Construct date ensuring local interpretation (Year, Month Index 0-11, Day)
                        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                        const moodConfig = getMoodConfig(day.mood);

                        return (
                            <div key={idx} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-100 transition-all relative overflow-hidden group">
                                {/* Decorative background blob */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-60 group-hover:scale-110 transition-transform duration-500"></div>

                                <div className="flex flex-col sm:flex-row gap-5 relative z-10">
                                    {/* Date Block */}
                                    <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-0 bg-gray-50 sm:bg-white sm:border-2 sm:border-indigo-50 rounded-2xl p-3 sm:w-20 shrink-0 transition-colors group-hover:border-indigo-100">
                                        <div className="flex items-center sm:flex-col gap-2 sm:gap-0">
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{dateObj.toLocaleString(lang, { month: 'short' }).replace('.', '')}</span>
                                            <span className="text-2xl sm:text-3xl font-black text-indigo-900 leading-none">{dateObj.getDate()}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 uppercase sm:hidden">{dateObj.toLocaleString(lang, { weekday: 'short' })}</span>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header: Day Name & Mood */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-800 capitalize hidden sm:block leading-tight">{dateObj.toLocaleString(lang, { weekday: 'long' })}</h4>
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 border ${moodConfig.color}`}>
                                                    {moodConfig.icon}
                                                    <span>{moodConfig.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {/* Water */}
                                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50 group-hover:border-blue-100 transition-colors">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-[10px] font-bold text-blue-400 uppercase">{t.dashboard_water}</span>
                                                </div>
                                                <span className="text-lg font-black text-blue-700 leading-none">{day.waterGlasses || 0}</span>
                                            </div>
                                            {/* Food */}
                                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 group-hover:border-emerald-100 transition-colors">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase">{t.dashboard_meals}</span>
                                                </div>
                                                <span className="text-lg font-black text-emerald-700 leading-none">{day.foodCount || 0}</span>
                                            </div>
                                            {/* Exercise */}
                                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-orange-50/50 border border-orange-100/50 group-hover:border-orange-100 transition-colors">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Activity className="w-3.5 h-3.5 text-orange-500" />
                                                    <span className="text-[10px] font-bold text-orange-400 uppercase">{t.dashboard_activity}</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-lg font-black text-orange-700 leading-none">{day.exerciseMins || 0}</span>
                                                    <span className="text-[10px] font-bold text-orange-400">m</span>
                                                </div>
                                            </div>
                                            {/* Sleep */}
                                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50/50 border border-purple-100/50 group-hover:border-purple-100 transition-colors">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Moon className="w-3.5 h-3.5 text-purple-500" />
                                                    <span className="text-[10px] font-bold text-purple-400 uppercase">{t.dashboard_sleep}</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-lg font-black text-purple-700 leading-none">{day.sleepHours || 0}</span>
                                                    <span className="text-[10px] font-bold text-purple-400">h</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-8">
                    {trendsData.length === 0 && (
                        <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                            <Activity className="w-12 h-12 mb-2 text-gray-200" />
                            <p>{t.dashboard_no_trends}</p>
                        </div>
                    )}
                    
                    {trendsData.length > 0 && (
                        <>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-600 mb-6 flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-500" /> {t.dashboard_avg_cal}
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendsData}>
                                            <defs>
                                                <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="week" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} 
                                                cursor={{stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4'}}
                                            />
                                            <Area type="monotone" dataKey="avgCalories" stroke="#f97316" fillOpacity={1} fill="url(#colorCal)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-600 mb-6 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" /> {t.dashboard_savings}
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trendsData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="week" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} 
                                                cursor={{fill: '#ecfdf5'}} 
                                            />
                                            <Bar dataKey="savings" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
