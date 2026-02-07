
import React from 'react';
import { X, Sparkles, TrendingUp, Brain, Heart, Wallet, Flame, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any | null; // Changed to any to handle JSON object
  loading: boolean;
  lang: Language;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, report, loading, lang = 'es' }) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 animate-fade-in flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex justify-between items-center shadow-lg z-20">
            <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-300" /> 
                    {t.report_title}
                </h2>
                <p className="text-indigo-100 text-xs mt-1 opacity-80">{t.report_powered}</p>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-indigo-600 font-bold animate-pulse text-lg">{t.report_generating}</p>
                </div>
            ) : report ? (
                <>
                    {/* Financial Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                        <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Wallet className="w-5 h-5" /></div>
                            <h3 className="text-lg font-bold text-gray-800">{t.report_finance}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <p className="text-xs text-red-500 font-bold uppercase">{t.report_restaurant}</p>
                                <p className="text-2xl font-black text-red-700">{report.financial?.currency}{report.financial?.totalSpentRestaurant}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <p className="text-xs text-emerald-500 font-bold uppercase">{t.report_homemade}</p>
                                <p className="text-2xl font-black text-emerald-700">{report.financial?.currency}{report.financial?.totalCostHome}</p>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800 leading-relaxed font-medium">{report.financial?.insight}</p>
                        </div>
                        {report.financial?.potentialSavings > 0 && (
                            <div className="mt-4 text-center">
                                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                                    {t.report_potential_savings} {report.financial?.currency}{report.financial?.potentialSavings}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Health Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
                            <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Heart className="w-5 h-5" /></div>
                                <h3 className="text-lg font-bold text-gray-800">{t.report_health}</h3>
                            </div>
                            <div className="text-center mb-4">
                                <p className="text-3xl font-black text-gray-800">{report.health?.avgDailyCalories}</p>
                                <p className="text-xs text-gray-400 font-bold uppercase">{t.report_avg_cal}</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl">
                                {report.health?.insight}
                            </p>
                        </div>

                        {/* Emotional Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
                            <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                                <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Brain className="w-5 h-5" /></div>
                                <h3 className="text-lg font-bold text-gray-800">{t.report_emotional}</h3>
                            </div>
                            <div className="mb-4 text-center">
                                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-bold border border-purple-100">
                                    {t.report_mood} {report.emotional?.mainMood}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl">
                                {report.emotional?.insight}
                            </p>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">{t.report_key_suggestions}</h3>
                        {report.suggestions?.map((s: any, i: number) => (
                            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start transition-transform hover:scale-[1.01]">
                                <div className="bg-indigo-50 p-2 rounded-full text-indigo-500 shrink-0">
                                    {s.icon === 'wallet' ? <Wallet className="w-5 h-5" /> : 
                                     s.icon === 'heart' ? <Heart className="w-5 h-5" /> : 
                                     s.icon === 'brain' ? <Brain className="w-5 h-5" /> :
                                     <Flame className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm mb-1">{s.title}</h4>
                                    <p className="text-sm text-gray-600 leading-snug">{s.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p>{t.report_error}</p>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
            <button onClick={onClose} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]">
                {t.report_btn_close}
            </button>
        </div>
      </div>
    </div>
  );
};
