
import React, { useState } from 'react';
import { NutritionAnalysis, Language, EatingMood, MealType, FoodSource } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle, Scale, Leaf, Flame, Fish, Wheat, Droplet, Info, Award, Share2, Loader2, PiggyBank, TrendingUp, Utensils, Zap, Coffee, CloudRain, PartyPopper, Sun, Moon, Sunrise, Cookie, Home, Store, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { translations } from '../data/translations';

interface AnalysisResultProps {
  data: NutritionAnalysis & { id?: string, eatingMood?: EatingMood, mealType?: MealType, source?: FoodSource, realCost?: number };
  image: string | null;
  lang: Language;
  onUpdateMood?: (id: string, mood: EatingMood) => void;
  onUpdateMealType?: (id: string, type: MealType) => void;
  onUpdateSource?: (id: string, source: FoodSource, realCost?: number) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentMood?: EatingMood; 
  hasPrev?: boolean;
  hasNext?: boolean;
}

const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'];

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ 
    data, 
    image, 
    lang = 'es', 
    onUpdateMood, 
    onUpdateMealType, 
    onUpdateSource,
    onNavigate,
    hasPrev,
    hasNext
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const t = translations[lang];
  
  const currentEatingMood = data.eatingMood;
  const currentMealType = data.mealType;
  const currentSource = data.source || 'homemade';
  // Allow user to see empty input if no cost recorded yet
  const currentCost = data.realCost !== undefined ? data.realCost : ''; 
  const itemId = data.id || ''; 

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (onUpdateSource) {
          onUpdateSource(itemId, 'restaurant', isNaN(val) ? 0 : val);
      }
  };

  const macroData = [
    { name: t.analysis_protein, value: data.macros.proteina_g },
    { name: t.analysis_carbs, value: data.macros.carbohidratos_g },
    { name: t.analysis_fat, value: data.macros.grasas_g },
    { name: t.analysis_fiber, value: data.macros.fibra_g },
  ];

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY + lineHeight; 
  };

  const generateShareImage = async (): Promise<File | null> => {
      if (!image) return null;
      return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
              const maxWidth = 1080;
              const scale = maxWidth / img.width;
              canvas.width = maxWidth;
              canvas.height = img.height * scale;
              if (!ctx) { resolve(null); return; }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const gradientHeight = 500;
              const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
              gradient.addColorStop(0, "rgba(0,0,0,0)");
              gradient.addColorStop(0.3, "rgba(0,0,0,0.7)");
              gradient.addColorStop(1, "rgba(0,0,0,0.95)");
              ctx.fillStyle = gradient;
              ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);
              ctx.fillStyle = "#ffffff";
              ctx.shadowColor = "rgba(0,0,0,0.5)";
              ctx.shadowBlur = 10;
              ctx.font = "bold 60px Inter, sans-serif";
              const titleY = canvas.height - 220;
              const nextY = wrapText(ctx, data.alimento, 40, titleY, canvas.width - 80, 70);
              ctx.font = "bold 40px Inter, sans-serif";
              ctx.fillStyle = "#34D399"; 
              const savingsText = data.costo_analisis?.ahorro > 0 
                  ? ` | ${t.analysis_savings_title}: ${data.costo_analisis.moneda}${data.costo_analisis.ahorro}` 
                  : "";
              ctx.fillText(`🔥 ${data.calorias.total} kcal${savingsText}`, 40, nextY + 10);
              ctx.font = "30px Inter, sans-serif";
              ctx.fillStyle = "#e2e8f0"; 
              const macroText = `P: ${data.macros.proteina_g}g  |  C: ${data.macros.carbohidratos_g}g  |  G: ${data.macros.grasas_g}g`;
              ctx.fillText(macroText, 40, nextY + 60);
              ctx.font = "bold 30px sans-serif";
              ctx.fillStyle = "rgba(255,255,255,0.8)";
              ctx.textAlign = "right";
              ctx.fillText(`${t.app_name} AI`, canvas.width - 40, 60);
              canvas.toBlob((blob) => {
                  if (blob) {
                      const file = new File([blob], "nutrisnap-result.png", { type: "image/png" });
                      resolve(file);
                  } else {
                      resolve(null);
                  }
              }, 'image/png');
          };
          img.src = image;
      });
  };

  const handleShare = async () => {
      setIsSharing(true);
      const savingsMsg = data.costo_analisis?.ahorro > 0 
        ? `\n💰 ${t.analysis_savings_title}: ${data.costo_analisis.moneda}${data.costo_analisis.ahorro}` 
        : "";
      const shareText = `🍽️ ${data.alimento}\n🔥 ${data.calorias.total} kcal\n💪 P: ${data.macros.proteina_g}g | 🍞 C: ${data.macros.carbohidratos_g}g | 🥑 G: ${data.macros.grasas_g}g${savingsMsg}\n\nAnalizado con ${t.app_name} 🌿`;
      try {
          const file = await generateShareImage();
          if (navigator.share && file) {
              await navigator.share({ title: `${t.app_name} Analysis`, text: shareText, files: [file] });
          } else {
               await navigator.clipboard.writeText(shareText);
               alert(t.msg_copied);
          }
      } catch (e) {
          console.error("Error sharing:", e);
      } finally {
          setIsSharing(false);
      }
  };

  const eatingMoods: { id: EatingMood, label: string, icon: React.ReactNode, activeClass: string }[] = [
      { id: 'hungry', label: t.eating_mood_hungry, icon: <Utensils className="w-5 h-5" />, activeClass: "bg-emerald-100 border-emerald-300 text-emerald-700 shadow-md transform scale-105" },
      { id: 'stressed', label: t.eating_mood_stressed, icon: <Zap className="w-5 h-5" />, activeClass: "bg-orange-100 border-orange-300 text-orange-700 shadow-md transform scale-105" },
      { id: 'bored', label: t.eating_mood_bored, icon: <Coffee className="w-5 h-5" />, activeClass: "bg-gray-200 border-gray-400 text-gray-700 shadow-md transform scale-105" },
      { id: 'sad', label: t.eating_mood_sad, icon: <CloudRain className="w-5 h-5" />, activeClass: "bg-blue-100 border-blue-300 text-blue-700 shadow-md transform scale-105" },
      { id: 'happy', label: t.eating_mood_happy, icon: <PartyPopper className="w-5 h-5" />, activeClass: "bg-yellow-100 border-yellow-300 text-yellow-700 shadow-md transform scale-105" },
  ];

  const mealTypes: { id: MealType, label: string, icon: React.ReactNode }[] = [
      { id: 'breakfast', label: t.meal_type_breakfast, icon: <Sunrise className="w-4 h-4" /> },
      { id: 'lunch', label: t.meal_type_lunch, icon: <Sun className="w-4 h-4" /> },
      { id: 'dinner', label: t.meal_type_dinner, icon: <Moon className="w-4 h-4" /> },
      { id: 'snack', label: t.meal_type_snack, icon: <Cookie className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-8 relative">
      
      {/* Navigation Buttons */}
      {onNavigate && (
          <>
            <button 
                onClick={() => onNavigate('prev')} 
                disabled={!hasPrev}
                className={`fixed left-2 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full shadow-lg transition-all border ${hasPrev ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200' : 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed'}`}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
                onClick={() => onNavigate('next')} 
                disabled={!hasNext}
                className={`fixed right-2 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full shadow-lg transition-all border ${hasNext ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200' : 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed'}`}
            >
                <ChevronRight className="w-6 h-6" />
            </button>
          </>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md relative">
        <button onClick={handleShare} disabled={isSharing} className="absolute top-4 right-4 md:static md:order-last p-2.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 active:scale-95 transition-all border border-indigo-100 shadow-sm z-10" title="Share">
            {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
        </button>
        <div className="w-full md:w-auto overflow-hidden">
          <div className="flex items-start gap-3 pr-10 md:pr-0">
             <span className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0 mt-1"><Leaf className="w-6 h-6" /></span>
            <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight line-clamp-2 break-words" title={data.alimento}>{data.alimento}</h2>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <p className="text-gray-500 text-sm">{t.label_weight}: <span className="font-medium text-gray-700">{data.peso_estimado_g}g</span></p>
                    {onUpdateMealType && (
                        <div className="flex gap-1">
                            {mealTypes.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => onUpdateMealType(itemId, m.id)}
                                    className={`p-1.5 rounded-lg transition-colors border ${currentMealType === m.id ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                                    title={m.label}
                                >
                                    {m.icon}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-auto flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 px-5 py-3 rounded-2xl shrink-0">
           <div className="bg-orange-100 p-2.5 rounded-full text-orange-500 shrink-0"><Flame className="w-5 h-5 md:w-6 md:h-6" /></div>
           <div>
             <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">{t.analysis_energy}</p>
             <div className="flex items-baseline gap-1"><p className="text-2xl md:text-3xl font-extrabold text-emerald-900 leading-none">{data.calorias.total}</p><span className="text-sm font-medium text-emerald-600">kcal</span></div>
             <p className="text-[10px] text-gray-400 mt-0.5">{data.calorias.rango}</p>
           </div>
        </div>
      </div>

      {onUpdateMood && (
        <div className="bg-white p-5 rounded-2xl border border-indigo-50 shadow-sm animate-fade-in">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 text-center">{t.eating_mood_title}</h3>
             <div className="flex flex-wrap justify-center gap-3">
                 {eatingMoods.map(mood => (
                     <button
                        key={mood.id}
                        type="button"
                        onClick={() => onUpdateMood(itemId, mood.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer min-w-[80px] ${
                            currentEatingMood === mood.id 
                            ? mood.activeClass 
                            : "bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-400"
                        }`}
                     >
                         {mood.icon}
                         <span className="text-xs font-bold">{mood.label}</span>
                     </button>
                 ))}
             </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center gap-2"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-full mb-1"><Fish className="w-5 h-5" /></div><div><span className="block text-xl md:text-2xl font-bold text-gray-800">{data.macros.proteina_g}g</span><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.analysis_protein}</span></div></div>
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center gap-2"><div className="p-2 bg-blue-50 text-blue-500 rounded-full mb-1"><Wheat className="w-5 h-5" /></div><div><span className="block text-xl md:text-2xl font-bold text-gray-800">{data.macros.carbohidratos_g}g</span><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.analysis_carbs}</span></div></div>
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center text-center gap-2"><div className="p-2 bg-red-50 text-red-400 rounded-full mb-1"><Droplet className="w-5 h-5" /></div><div><span className="block text-xl md:text-2xl font-bold text-gray-800">{data.macros.grasas_g}g</span><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.analysis_fat}</span></div></div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center gap-2"><div className="p-2 bg-amber-50 text-amber-500 rounded-full mb-1"><Leaf className="w-5 h-5" /></div><div><span className="block text-xl md:text-2xl font-bold text-gray-800">{data.macros.fibra_g}g</span><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.analysis_fiber}</span></div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> {t.analysis_energy}</h3>
                <div className="h-[280px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie data={macroData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                            {macroData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#374151', fontWeight: 600 }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-xs font-medium text-gray-500 ml-1">{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Award className="w-4 h-4" /> {t.analysis_micros}</h3>
                <div className="space-y-3">
                    {data.micros_principales.length > 0 ? (
                        data.micros_principales.map((micro, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                                <span className="text-sm font-medium text-gray-700">{micro.nutriente}</span>
                                <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-md shadow-sm border border-emerald-100/50">{micro.cantidad}</span>
                            </div>
                        ))
                    ) : <div className="p-4 text-center text-gray-400 text-sm italic bg-gray-50 rounded-xl">{t.analysis_no_micros}</div>}
                </div>
            </div>
        </div>

        <div className="md:col-span-7 space-y-6">
            <div className={`rounded-2xl shadow-sm border p-6 ${data.balanceado ? 'bg-blue-50/50 border-blue-100' : 'bg-orange-50/50 border-orange-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-full ${data.balanceado ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}><Scale className="w-5 h-5" /></div>
                    <h3 className={`text-lg font-bold ${data.balanceado ? "text-blue-800" : "text-orange-800"}`}>{data.balanceado ? t.analysis_balance : t.analysis_adjust}</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{data.analisis}</p>
            </div>

            {onUpdateSource && (
                <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-6">
                    <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> {t.analysis_source_title}
                    </h3>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl mb-4">
                        <button 
                            onClick={() => onUpdateSource(itemId, 'homemade')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${currentSource === 'homemade' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Home className="w-4 h-4" /> {t.analysis_source_homemade}
                        </button>
                        <button 
                            onClick={() => onUpdateSource(itemId, 'restaurant')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${currentSource === 'restaurant' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Store className="w-4 h-4" /> {t.analysis_source_restaurant}
                        </button>
                    </div>

                    {currentSource === 'restaurant' && (
                        <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100 animate-fade-in">
                            <DollarSign className="w-5 h-5 text-indigo-500" />
                            <div className="flex-1">
                                <label className="block text-[10px] uppercase font-bold text-indigo-400 mb-1">{t.analysis_cost_label} ({data.costo_analisis?.moneda || '$'})</label>
                                <input 
                                    type="number" 
                                    value={currentCost} 
                                    onChange={handleCostChange} 
                                    placeholder={t.analysis_cost_placeholder}
                                    className="w-full bg-transparent text-lg font-bold text-indigo-900 outline-none placeholder:text-indigo-200"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {data.costo_analisis && currentSource === 'homemade' && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><PiggyBank className="w-24 h-24 text-emerald-600" /></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-teal-600" /> {t.analysis_savings_title}</h3>
                        <div className="flex flex-wrap gap-4 items-end mb-4">
                            <div><p className="text-xs text-teal-600 uppercase font-bold tracking-wide">{t.analysis_home_cost}</p><p className="text-2xl font-black text-teal-800">{data.costo_analisis.moneda}{data.costo_analisis.costo_casero_estimado}</p></div>
                            <div className="pb-1 text-gray-400 font-medium">vs</div>
                            <div><p className="text-xs text-gray-500 uppercase font-bold tracking-wide">{t.analysis_restaurant_cost}</p><p className="text-xl font-bold text-gray-500 line-through decoration-red-400">{data.costo_analisis.moneda}{data.costo_analisis.costo_restaurante_estimado}</p></div>
                        </div>
                        {data.costo_analisis.ahorro > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-emerald-200 inline-block">
                                <p className="text-sm font-bold text-emerald-700 flex items-center gap-2"><PiggyBank className="w-4 h-4" /> {t.analysis_savings_msg.replace('{amount}', `${data.costo_analisis.moneda}${data.costo_analisis.ahorro}`)}</p>
                            </div>
                        )}
                        <p className="mt-3 text-sm text-teal-700 italic">"{data.costo_analisis.mensaje_ahorro}"</p>
                    </div>
                </div>
            )}

            <div className="bg-emerald-50/30 rounded-2xl shadow-sm border border-emerald-100 p-6">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-5 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t.analysis_recommendations}</h3>
                <div className="space-y-4">
                    {data.recomendaciones.map((rec, idx) => (
                        <div key={idx} className="flex gap-4 bg-white p-4 rounded-xl border border-emerald-50 shadow-sm hover:shadow-md transition-all group">
                            <div className="mt-1 min-w-[28px]"><div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors"><span className="text-xs font-bold text-emerald-700 group-hover:text-white transition-colors">{idx + 1}</span></div></div>
                            <span className="text-sm text-gray-600 leading-relaxed">{rec}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
