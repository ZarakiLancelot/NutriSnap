
import React, { useMemo } from 'react';
import { AvatarArchetype, Mood, MascotCondition, Language } from '../types';
import { translations } from '../data/translations';

interface SpiritAnimalProps {
  archetype: AvatarArchetype;
  progress: number; 
  userName: string;
  mood?: Mood;
  gender?: 'male' | 'female' | 'other';
  pose?: 'default' | 'peeking';
  condition?: MascotCondition;
  lang?: Language;
}

export const SpiritAnimal: React.FC<SpiritAnimalProps> = ({ 
  archetype, 
  progress, 
  userName, 
  mood = 'neutral', 
  gender = 'male', 
  pose = 'default',
  condition = 'normal',
  lang = 'es'
}) => {
  const t = translations[lang];
  
  const stage = useMemo(() => {
      if (progress < 30) return 1; 
      if (progress < 80) return 2; 
      return 3; 
  }, [progress]);

  // VITA Configuration
  let mainColor = '#76c043'; // Base Green
  let highlightColor = '#a3d977'; // Lighter Green
  let strokeColor = '#4a8a2a'; // Darker Green outline
  let animationClass = "animate-breathe";
  let opacity = 1;

  // Condition Overrides
  if (condition === 'dehydrated') {
      mainColor = '#dcb96b'; // Dry yellow/brown
      highlightColor = '#eaddb0';
      strokeColor = '#8d7842';
      animationClass = ""; 
      opacity = 0.9;
  } else if (condition === 'sick') {
      mainColor = '#a8c6a0'; // Pale sickly green
      highlightColor = '#cddec9';
      strokeColor = '#5f7a58';
      animationClass = "animate-pulse-slow"; 
  } else if (condition === 'super') {
      mainColor = '#4ADE80'; // Neon Green
      highlightColor = '#86efac';
      strokeColor = '#166534';
      animationClass = "animate-bounce-slight";
  } else if (condition === 'sleepy') {
      mainColor = '#94a3b8'; // Blueish grey
      highlightColor = '#cbd5e1';
      strokeColor = '#475569';
      animationClass = "animate-sway"; 
  }

  const eyeOffsetY = pose === 'peeking' ? 10 : 0;
  
  const vitaLabel = condition === 'super' ? t.mascot_super :
                    condition === 'sick' ? t.mascot_sick :
                    condition === 'dehydrated' ? t.mascot_dehydrated :
                    condition === 'sleepy' ? t.mascot_sleepy :
                    stage === 1 ? "VITA (Semilla)" : 
                    stage === 2 ? "VITA (Brote)" : "VITA (Pleno)";

  return (
    <div className="relative flex flex-col items-center justify-center animate-fade-in w-full h-full">
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.02) translateY(-1px); }
        }
        .animate-breathe {
          animation: breathe 3.5s ease-in-out infinite;
        }
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes bounceSlight {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        .animate-bounce-slight {
            animation: bounceSlight 0.5s infinite;
        }
        @keyframes sway {
            0%, 100% { transform: rotate(-2deg); }
            50% { transform: rotate(2deg); }
        }
        .animate-sway {
            animation: sway 4s ease-in-out infinite;
        }
        @keyframes leafWave {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(5deg); }
        }
        .animate-leaf {
            transform-origin: 50% 100%;
            animation: leafWave 4s ease-in-out infinite;
        }
        @keyframes floatZ {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(10px, -20px) scale(1.2); opacity: 0; }
        }
        .zzz-1 { animation: floatZ 2s infinite; }
        .zzz-2 { animation: floatZ 2.5s infinite 1s; }
      `}</style>

      {/* Glow Effect for Super Mode */}
      {condition === 'super' && (
         <div className="absolute inset-0 bg-green-400/40 blur-2xl rounded-full animate-pulse scale-150"></div>
      )}
      
      {/* Sleep Zzzs */}
      {condition === 'sleepy' && (
          <div className="absolute -top-1 right-0 z-10 flex flex-col font-bold text-slate-400">
             <span className="zzz-1 text-xl">Z</span>
             <span className="zzz-2 text-sm ml-2">z</span>
          </div>
      )}

      {/* VITA SVG Character */}
      <div className={`relative w-full h-full transition-transform duration-500 ${animationClass} ${condition === 'super' ? 'scale-105' : 'scale-100'}`} style={{ opacity }}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md overflow-visible">
           
           {/* BODY (The Drop) */}
           {/* A smoother drop shape that tapers perfectly into the stem */}
           <path 
             d="M100 185 
                C 50 185 25 140 25 100 
                C 25 60 60 45 85 30 
                Q 95 24 97 10 
                L 103 10
                Q 105 24 115 30
                C 140 45 175 60 175 100
                C 175 140 150 185 100 185 Z"
             fill={mainColor} 
             stroke={strokeColor} 
             strokeWidth="3"
             strokeLinejoin="round"
           />

           {/* 3D Body Shine/Highlight */}
           <path 
             d="M 50 100 C 50 70 70 50 90 40" 
             fill="none" 
             stroke="white" 
             strokeWidth="8" 
             opacity="0.15" 
             strokeLinecap="round"
           />
           <ellipse cx="65" cy="80" rx="15" ry="25" fill="white" opacity="0.1" transform="rotate(-20 65 80)" />


           {/* LEAVES (Sprouting directly from the stem tip at 100,10) */}
           <g transform="translate(100, 10)">
                <g className={condition !== 'sleepy' ? "animate-leaf" : ""}>
                    {/* Left Leaf */}
                    <path d="M0,0 Q-30,-45 -65,-25 Q-35,10 0,0" fill={mainColor} stroke={strokeColor} strokeWidth="3" />
                    <path d="M0,0 Q-30,-45 -50,-30" fill="none" stroke={highlightColor} strokeWidth="2" opacity="0.6" />
                    
                    {/* Right Leaf */}
                    <path d="M0,0 Q30,-45 65,-25 Q35,10 0,0" fill={mainColor} stroke={strokeColor} strokeWidth="3" />
                    <path d="M0,0 Q30,-45 50,-30" fill="none" stroke={highlightColor} strokeWidth="2" opacity="0.6" />
                </g>
           </g>

           {/* FACE EXPRESSIONS */}
           <g id="face" transform={`translate(0, ${eyeOffsetY})`}>
               {/* Eyes */}
               {condition === 'sleepy' ? (
                   <g stroke={strokeColor} strokeWidth="3" fill="none" strokeLinecap="round">
                       <path d="M65 105 Q80 110 95 105" />
                       <path d="M105 105 Q120 110 135 105" />
                   </g>
               ) : condition === 'sick' ? (
                   <g>
                        <line x1="65" y1="100" x2="85" y2="110" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                        <line x1="65" y1="110" x2="85" y2="100" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                        <line x1="115" y1="100" x2="135" y2="110" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                        <line x1="115" y1="110" x2="135" y2="100" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                   </g>
               ) : (
                   <g>
                        {/* Eye Whites (Big and friendly) */}
                        <ellipse cx="75" cy="105" rx="14" ry="16" fill="white" stroke={strokeColor} strokeWidth="1" />
                        <ellipse cx="125" cy="105" rx="14" ry="16" fill="white" stroke={strokeColor} strokeWidth="1" />
                        
                        {/* Pupils */}
                        <circle cx={mood === 'suspicious' ? 80 : 75} cy="105" r="7" fill="#1e293b" />
                        <circle cx={mood === 'suspicious' ? 130 : 125} cy="105" r="7" fill="#1e293b" />
                        
                        {/* Eye Shine */}
                        <circle cx={mood === 'suspicious' ? 77 : 72} cy="101" r="3" fill="white" />
                        <circle cx={mood === 'suspicious' ? 127 : 122} cy="101" r="3" fill="white" />

                        {/* Eyelids/Eyebrows for emotions */}
                        {mood === 'sad' && (
                            <>
                                <path d="M60 95 Q75 105 90 95" fill={mainColor} stroke={strokeColor} strokeWidth="1" />
                                <path d="M110 95 Q125 105 140 95" fill={mainColor} stroke={strokeColor} strokeWidth="1" />
                            </>
                        )}
                        {mood === 'angry' && (
                             <>
                                <path d="M60 95 L85 105" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                                <path d="M140 95 L115 105" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                            </>
                        )}
                   </g>
               )}

               {/* Mouth */}
               <g transform="translate(0, 5)">
                   {condition === 'sick' ? (
                       <path d="M90 125 Q100 120 110 125" fill="none" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />
                   ) : condition === 'sleepy' ? (
                        <circle cx="100" cy="125" r="3" fill="#3E2723" opacity="0.5" />
                   ) : (
                       <>
                           {mood === 'neutral' && <path d="M90 125 Q100 130 110 125" fill="none" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />}
                           {(mood === 'happy' || mood === 'excited' || condition === 'super') && (
                               <path d="M85 120 Q100 135 115 120" fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                           )}
                           {mood === 'sad' && <path d="M90 130 Q100 123 110 130" fill="none" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />}
                           {mood === 'angry' && <path d="M90 125 L110 125" fill="none" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />}
                           {mood === 'suspicious' && <path d="M92 125 L108 123" fill="none" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />}
                       </>
                   )}
               </g>

               {/* Cheeks */}
               {(mood === 'happy' || mood === 'excited' || condition === 'super') && (
                   <>
                    <ellipse cx="60" cy="120" rx="6" ry="3" fill="#ef4444" opacity="0.3" />
                    <ellipse cx="140" cy="120" rx="6" ry="3" fill="#ef4444" opacity="0.3" />
                   </>
               )}
           </g>

        </svg>
      </div>

      {pose === 'default' && (
        <div className="mt-2 text-center absolute -bottom-6 w-full">
            <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm border whitespace-nowrap ${
                condition === 'super' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse' :
                condition === 'sick' ? 'bg-green-100 text-green-800 border-green-200' :
                condition === 'dehydrated' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                condition === 'sleepy' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
                {vitaLabel}
            </span>
        </div>
      )}
    </div>
  );
};
