
import React from 'react';
import { HistoryItem, Language } from '../types';
import { Clock, Calendar, Trash2, ChevronRight, Flame, Utensils, FileText, Grid } from 'lucide-react';
import { translations } from '../data/translations';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onGenerateReport: () => void;
  onViewAll: () => void;
  lang: Language;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete, onGenerateReport, onViewAll, lang = 'es' }) => {
  const t = translations[lang];

  // Show only top 5 recent items in this view
  const recentHistory = history.slice(0, 5);

  // Helper to render the header part
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            {t.history_title}
        </h3>
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={onGenerateReport}
                className="flex-1 sm:flex-none justify-center text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
                <FileText className="w-3 h-3" /> {t.history_weekly_report}
            </button>
            {history.length > 0 && (
                <button 
                    onClick={onViewAll}
                    className="flex-1 sm:flex-none justify-center text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                    <Grid className="w-3 h-3" /> {t.history_view_all} ({history.length})
                </button>
            )}
        </div>
    </div>
  );

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (history.length === 0) {
    return (
      <div className="w-full mt-12 animate-fade-in border-t border-gray-100 pt-8">
        {renderHeader()}
        <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                <Utensils className="w-8 h-8 text-emerald-200" />
            </div>
            <p className="text-gray-600 font-bold mb-1">{t.history_empty}</p>
            <p className="text-gray-400 text-sm">{t.history_empty_sub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-12 animate-fade-in border-t border-gray-100 pt-8">
      {renderHeader()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentHistory.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer overflow-hidden flex flex-row h-28"
          >
            <div className="w-28 h-full relative shrink-0 overflow-hidden bg-gray-100">
              <img src={item.imageBase64} alt={item.alimento} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between relative">
               <button onClick={(e) => onDelete(e, item.id)} className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10" title="Delete"><Trash2 className="w-4 h-4" /></button>
               <div>
                 <h4 className="font-bold text-gray-800 text-sm line-clamp-1 pr-6">{item.alimento}</h4>
                 <div className="flex items-center gap-1 mt-1 text-xs text-gray-400"><Calendar className="w-3 h-3" /><span>{formatDate(item.timestamp)}</span></div>
               </div>
               <div className="flex justify-between items-end mt-2">
                  <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg"><Flame className="w-3 h-3 text-orange-500" /><span className="text-xs font-bold text-orange-700">{item.calorias.total} kcal</span></div>
                  <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300"><ChevronRight className="w-5 h-5" /></div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
