
import React, { useState, useEffect, useRef } from 'react';
import { NutritionAnalysis, UserProfile, Mood, MascotCondition, HistoryItem, Language } from '../types';
import { X } from 'lucide-react';
import { SpiritAnimal } from './SpiritAnimal';
import { translations } from '../data/translations';

interface MascotProps {
  userProfile: UserProfile | null;
  historyCount: number;
  lastAnalysis: NutritionAnalysis | null;
  todayWater?: number;
  todayExercise?: number;
  condition?: MascotCondition;
  history?: HistoryItem[]; 
  lang: Language;
}

type MascotRole = 'normal' | 'doctor' | 'detective';

export const Mascot: React.FC<MascotProps> = ({ 
  userProfile, 
  historyCount, 
  lastAnalysis, 
  todayWater = 0, 
  todayExercise = 0,
  condition = 'normal',
  history = [],
  lang = 'es'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [mood, setMood] = useState<Mood>('neutral');
  const [role, setRole] = useState<MascotRole>('normal');
  const analysisRef = useRef<NutritionAnalysis | null>(null);

  const hasProfile = !!userProfile;
  const userName = userProfile?.name || (lang === 'en' ? "friend" : "amigo");
  const xp = userProfile?.gamification?.xp || 0;
  const progress = Math.min(100, (xp / 1000) * 100); 
  const t = translations[lang];

  useEffect(() => {
    if (lastAnalysis) {
        setRole('doctor'); 
    } else if (!hasProfile || historyCount === 0) {
        setRole('detective'); 
    } else {
        setRole('normal');
    }
  }, [lastAnalysis, hasProfile, historyCount]);

  useEffect(() => {
    if (lastAnalysis && lastAnalysis !== analysisRef.current) {
        analysisRef.current = lastAnalysis;
        const { calorias, balanceado, alimento } = lastAnalysis;
        let text = "";
        let newMood: Mood = 'neutral';

        const scenarios = [
            {
                condition: calorias.total > 800,
                texts: lang === 'en' 
                    ? [`${calorias.total} kcal! Keep moving later!`, `Heavy meal detected!`] 
                    : [`¡${calorias.total} kcal! He visto bodas más ligeras.`, "Coma inminente. ¡Muévete luego!"],
                mood: 'angry' as Mood
            },
            {
                condition: calorias.total < 150,
                texts: lang === 'en' 
                    ? [`Is that all? Feed the machine!`, `Tiny snack detected.`] 
                    : [`¿Eso es todo? Mi lupa no lo ve.`, "Alimenta a la máquina."],
                mood: 'suspicious' as Mood
            },
            {
                condition: !balanceado,
                texts: lang === 'en' 
                    ? [`Imbalanced. Add some colors!`, `Check my notes.`]
                    : [`Detecto desequilibrio. Revisa mis notas.`, "Falta color en ese plato."],
                mood: 'angry' as Mood
            },
            {
                condition: true,
                texts: lang === 'en' 
                    ? [`Analyzing ${alimento}...`, `Check the energy chart.`]
                    : [`Analizando ${alimento}... lee el resumen.`, "Mira el gráfico de energía."],
                mood: 'neutral' as Mood
            }
        ];

        const match = scenarios.find(s => s.condition);
        if (match) {
            text = match.texts[Math.floor(Math.random() * match.texts.length)];
            newMood = match.mood;
        }

        setMessage(text);
        setMood(newMood);
        setIsVisible(true);
        const timer = setTimeout(() => setIsVisible(false), 8000);
        return () => clearTimeout(timer);
    }
  }, [lastAnalysis, userProfile, userName, lang]);

  useEffect(() => {
    const triggerContextualMessage = () => {
      if (isVisible) return; 

      const now = new Date();
      const hour = now.getHours();
      const todayString = now.toISOString().split('T')[0];
      
      const todayLogs = history.filter(h => new Date(h.timestamp).toISOString().split('T')[0] === todayString);
      const hasBreakfast = todayLogs.some(h => {
          const hHour = new Date(h.timestamp).getHours();
          return hHour >= 5 && hHour < 11;
      });
      const hasLunch = todayLogs.some(h => {
          const hHour = new Date(h.timestamp).getHours();
          return hHour >= 12 && hHour < 15;
      });
      const hasHealthyFood = todayLogs.some(h => h.balanceado);

      let text = "";
      let newMood: Mood = 'neutral';
      let priority = 0; 

      if (condition === 'sleepy') {
          text = lang === 'en' 
            ? `Yawn... Breakfast time, ${userName}? I need coffee... I mean, water. 💤`
            : `Bostezo... ¿Qué hay de desayunar, ${userName}? Necesito café... digo, agua. 💤`;
          newMood = 'sleepy';
          priority = 10;
      } else if (condition === 'dehydrated') {
          text = lang === 'en' ? "I feel... like a raisin... water... 🏜️" : "Me siento... como una pasa... agua... 🏜️";
          newMood = 'sad';
          priority = 9;
      } else if (condition === 'sick') {
          text = lang === 'en' ? "Ugh... too much grease... tummy hurts. 🤢" : "Ugh... demasiada grasa o azúcar... me duele la panza. 🤢";
          newMood = 'sad';
          priority = 9;
      } else if (condition === 'super') {
          text = lang === 'en' ? `FULL POWER! LET'S GO ${userName.toUpperCase()}! ⚡` : `¡ESTOY A TOPE DE ENERGÍA! ¡VAMOS ${userName.toUpperCase()}! ⚡`;
          newMood = 'excited';
          priority = 8;
      }

      if (priority < 5) {
          if (hour >= 6 && hour < 11) {
              if (!hasBreakfast) {
                  text = lang === 'en' ? "No breakfast yet? Engine needs fuel." : "¿Aún no desayunas? El motor no arranca sin gasolina.";
                  newMood = 'neutral';
              } else if (todayWater === 0) {
                  text = lang === 'en' ? "Nice breakfast, but... where's the water?" : "Buen desayuno, pero... ¿dónde está el primer vaso de agua?";
                  newMood = 'suspicious';
              }
          } else if (hour >= 11 && hour < 13) {
              if (!hasHealthyFood && todayLogs.length > 0) {
                  text = lang === 'en' ? "Haven't seen anything green today..." : "Aún no he visto nada verde hoy... me preocupas.";
                  newMood = 'sad'; 
              } else if (todayWater < 2) {
                  text = lang === 'en' ? "Dehydration drops performance. Drink!" : "La deshidratación baja el rendimiento. ¡Bebe!";
                  newMood = 'angry';
              }
          } else if (hour >= 13 && hour < 16) {
              if (!hasLunch) {
                  text = lang === 'en' ? "What's for lunch? Scan it first!" : "¿Qué vamos a almorzar? ¡Analízalo antes de comer!";
                  newMood = 'excited';
              } else {
                   const lunch = todayLogs.find(h => {
                      const hHour = new Date(h.timestamp).getHours();
                      return hHour >= 12 && hHour < 15;
                   });
                   if (lunch && !lunch.balanceado) {
                       text = lang === 'en' ? "Heavy lunch... maybe a walk?" : "Ese almuerzo estuvo pesado... ¿caminamos un poco?";
                       newMood = 'neutral';
                   }
              }
          } else if (hour >= 16 && hour < 19) {
              if (todayExercise < (userProfile?.exerciseAmount || 30) && Math.random() > 0.5) {
                   text = lang === 'en' ? "Sun's going down, exercise goal isn't met..." : "La tarde cae y la meta de ejercicio sigue lejos...";
                   newMood = 'suspicious';
              } else {
                  const rand = Math.random();
                  if (rand < 0.3) {
                      text = lang === 'en' ? "I smell chocolate... snacking secretly?" : "Huelo chocolate... ¿Estás comiendo dulces a escondidas?";
                      newMood = 'suspicious';
                  } else if (rand < 0.6) {
                      text = lang === 'en' ? "Is that fried food? Log it if you dare!" : "¿Son frituras lo que veo? ¡Regístralo si te atreves!";
                      newMood = 'angry';
                  }
              }
          } else if (hour >= 19) {
              text = lang === 'en' ? "What's for dinner? Keep it light." : "¿Qué vamos a cenar? Algo ligero por favor.";
              newMood = 'neutral';
          }
      }

      if (text) {
          setMessage(text);
          setMood(newMood); 
          setIsVisible(true);
          setTimeout(() => setIsVisible(false), 7000);
      }
    };

    const interval = setInterval(triggerContextualMessage, 60000); 
    const initialTimer = setTimeout(triggerContextualMessage, 2000);

    return () => {
        clearInterval(interval);
        clearTimeout(initialTimer);
    };
  }, [role, isVisible, hasProfile, historyCount, userProfile, userName, condition, todayWater, todayExercise, history, lang]);

  const handlePoke = () => {
    const responses = lang === 'en' 
        ? ["Hey!", "My fur!", "Stop poking!", "Zzz... huh?"]
        : ["¡Oiga!", "¡Me despeinas!", "¡Deja de tocar!", "Zzz... eh?"];
    setMessage(responses[Math.floor(Math.random() * responses.length)]);
    setMood('angry');
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 3000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start pointer-events-none">
      
      <div 
        className={`mb-2 ml-8 bg-white border-2 border-gray-800 rounded-2xl rounded-bl-none p-4 shadow-xl max-w-[240px] pointer-events-auto transition-all duration-300 transform origin-bottom-left ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300 transition-colors border border-gray-300"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
        <p className="text-sm font-bold text-gray-800 leading-snug font-mono">
          {message}
        </p>
      </div>

      <div onClick={handlePoke} className="w-28 h-28 relative cursor-pointer pointer-events-auto transition-transform hover:scale-110 active:scale-95">
         <SpiritAnimal 
            archetype={userProfile?.avatarArchetype || 'bear'}
            progress={progress}
            userName={userName}
            mood={mood}
            gender={userProfile?.gender || 'male'}
            condition={condition}
            lang={lang}
         />
      </div>

    </div>
  );
};
