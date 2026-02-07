
import React from 'react';
import { ExerciseLog } from '../types';
import { Activity, Calendar, Trash2, Clock, MapPin, Dumbbell, Footprints, Flame } from 'lucide-react';
import { translations } from '../data/translations';

interface ExerciseListProps {
  history: ExerciseLog[];
  onDelete: (e: React.MouseEvent, id: string) => void;
  lang?: 'es' | 'en';
}

export const ExerciseList: React.FC<ExerciseListProps> = ({ history, onDelete, lang = 'es' }) => {
  if (history.length === 0) return null;
  const t = translations[lang];

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getIcon = (type: string) => {
      const t = type.toLowerCase();
      if (t.includes('caminata') || t.includes('correr') || t.includes('walking') || t.includes('running')) return <Footprints className="w-5 h-5" />;
      if (t.includes('gimnasio') || t.includes('pesas') || t.includes('gym')) return <Dumbbell className="w-5 h-5" />;
      if (t.includes('yoga')) return <Flame className="w-5 h-5" />;
      return <Activity className="w-5 h-5" />;
  };

  return (
    <div className="w-full mt-8 animate-fade-in border-t border-gray-100 pt-8 mb-12">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-orange-500" />
        {t.exercise_recent}
      </h3>
      
      <div className="space-y-3">
        {history.slice(0, 5).map((item) => (
          <div 
            key={item.id}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all p-4 flex items-center justify-between relative"
          >
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                     {getIcon(item.type)}
                 </div>
                 <div>
                     <h4 className="font-bold text-gray-800">{item.type}</h4>
                     <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(item.timestamp)}
                        </span>
                     </div>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <div className="text-right">
                     <span className="block text-lg font-black text-gray-800 leading-none">
                         {item.amount} <span className="text-xs font-medium text-gray-400">{item.unit}</span>
                     </span>
                 </div>
                 
                 <button 
                    onClick={(e) => onDelete(e, item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title={t.exercise_delete}
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
             </div>
          </div>
        ))}
        {history.length > 5 && (
            <p className="text-center text-xs text-gray-400 mt-4 italic">{t.exercise_showing_last}</p>
        )}
      </div>
    </div>
  );
};
