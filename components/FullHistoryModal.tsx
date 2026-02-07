
import React, { useState, useMemo } from 'react';
import { HistoryItem, Language } from '../types';
import { X, Search, Calendar, Flame, Trash2, ChevronRight, Clock } from 'lucide-react';
import { translations } from '../data/translations';

interface FullHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  lang: Language;
}

export const FullHistoryModal: React.FC<FullHistoryModalProps> = ({ isOpen, onClose, history, onSelect, onDelete, lang = 'es' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[lang];

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
        item.alimento.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 animate-fade-in flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-20">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{t.history_full_title}</h2>
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-bold">{history.length}</span>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.history_search_placeholder}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
            {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <Search className="w-12 h-12 mb-2 opacity-20" />
                    <p>{t.history_no_results.replace('{term}', searchTerm)}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHistory.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer overflow-hidden flex flex-col h-auto animate-fade-in"
                        >
                            <div className="w-full h-32 relative overflow-hidden bg-gray-100">
                                <img src={item.imageBase64} alt={item.alimento} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                        {formatDate(item.timestamp)}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">{item.alimento}</h4>
                                    <button 
                                        onClick={(e) => onDelete(e, item.id)} 
                                        className="p-1.5 -mr-1 -mt-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm font-bold text-gray-700">{item.calorias.total} kcal</span>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
