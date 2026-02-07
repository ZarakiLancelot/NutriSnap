
import React, { useState } from 'react';
import { DailyMood, Language } from '../types';
import { Smile, Meh, Frown, ThumbsUp, Coffee, X } from 'lucide-react';
import { translations } from '../data/translations';

interface MoodLoggerProps {
  onSave: (mood: DailyMood) => void;
  onClose: () => void;
  lang: Language;
}

export const MoodLogger: React.FC<MoodLoggerProps> = ({ onSave, onClose, lang = 'es' }) => {
  const t = translations[lang];

  const moods: { type: DailyMood, icon: React.ReactNode, label: string, color: string }[] = [
    { type: 'great', icon: <ThumbsUp className="w-8 h-8" />, label: t.mood_great, color: 'bg-emerald-100 text-emerald-600 border-emerald-300' },
    { type: 'good', icon: <Smile className="w-8 h-8" />, label: t.mood_good, color: 'bg-blue-100 text-blue-600 border-blue-300' },
    { type: 'neutral', icon: <Meh className="w-8 h-8" />, label: t.mood_neutral, color: 'bg-gray-100 text-gray-600 border-gray-300' },
    { type: 'tired', icon: <Coffee className="w-8 h-8" />, label: t.mood_tired, color: 'bg-amber-100 text-amber-600 border-amber-300' },
    { type: 'bad', icon: <Frown className="w-8 h-8" />, label: t.mood_bad, color: 'bg-red-100 text-red-600 border-red-300' },
  ];

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-8 relative animate-fade-in">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
        <X className="w-5 h-5" />
      </button>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-indigo-900">{t.mood_title}</h3>
        <p className="text-sm text-gray-500">{t.mood_subtitle}</p>
      </div>
      <div className="flex justify-between gap-2 overflow-x-auto pb-2">
        {moods.map((m) => (
          <button
            key={m.type}
            onClick={() => onSave(m.type)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 min-w-[70px] ${m.color}`}
          >
            {m.icon}
            <span className="text-xs font-bold">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
