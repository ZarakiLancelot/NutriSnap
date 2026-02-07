import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile, ExerciseLog, Mood, MascotCondition, HistoryItem, Language, Currency } from '../types';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Calendar, CheckCircle2, Bell, AlertCircle, TrendingDown, Droplet, Activity, XCircle, Flame, Plus, Clock, ChevronRight, Minus, Share2, Loader2, Star, Zap, Search, Scale, Dumbbell, PiggyBank, Moon, RefreshCw, LayoutDashboard, Footprints } from 'lucide-react';
import { requestNotificationPermission, sendDailyReminder, scheduleReminders } from '../services/notificationService';
import { BADGES, getNextLevelXp, LEVEL_THRESHOLDS } from '../services/gamificationService';
import { translations } from '../data/translations';
import { GoogleFitService } from '../services/googleFitService';
import { HistoryDashboard } from './HistoryDashboard';

interface GoalTrackerProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  exerciseHistory: ExerciseLog[];
  onLogExercise: (type: string, amount: number, unit: string, source?: 'manual' | 'google_fit') => void;
  todayWater?: number;
  onLogWater?: (increment: number) => void;
  onLogWeight?: (weight: number, date: string) => void;
  mascotCondition?: MascotCondition;
  history?: HistoryItem[];
  lang: Language;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
    'USD': '$',
    'EUR': '€',
    'GTQ': 'Q',
    'MXN': '$',
    'COP': '$',
    'ARS': '$',
    'CLP': '$',
    'PEN': 'S/',
    'UYU': '$',
    'DOP': '$',
};

// Helper to get local date string YYYY-MM-DD
const getLocalTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Conversion rate: 100 steps approx 1 minute of moderate activity for goal tracking
const STEPS_TO_MINUTES_RATIO = 100;
const AUTO_SYNC_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 Hours

export const GoalTracker: React.FC<GoalTrackerProps> = ({ 
  profile, 
  onUpdateProfile, 
  exerciseHistory, 
  onLogExercise, 
  todayWater = 0, 
  onLogWater, 
  onLogWeight,
  mascotCondition = 'normal',
  history = [],
  lang = 'es'
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.enableNotifications);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isSharingDaily, setIsSharingDaily] = useState(false);
  const [isSharingGoal, setIsSharingGoal] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exType, setExType] = useState(profile.exerciseType);
  const [exAmount, setExAmount] = useState<string>('30');

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState<string>(profile.weightKg.toString());
  const [weightDateInput, setWeightDateInput] = useState<string>(getLocalTodayString());

  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepInput, setSleepInput] = useState<string>('7');
  const [sleepDateInput, setSleepDateInput] = useState<string>(getLocalTodayString());

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // Google Fit States
  const [isSyncingFit, setIsSyncingFit] = useState(false);
  
  const gamification = profile.gamification || { xp: 0, level: 1, unlockedBadges: [] };
  const nextLevelXp = getNextLevelXp(gamification.level);
  const currentLevelBaseXp = LEVEL_THRESHOLDS[gamification.level - 1] || 0;
  const xpProgress = ((gamification.xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100;
  
  const t = translations[lang];

  // Helper function to render badge icons
  const getBadgeIcon = (iconName: string) => {
    switch(iconName) {
        case 'Search': return <Search className="w-3 h-3" />;
        case 'Flame': return <Flame className="w-3 h-3" />;
        case 'Zap': return <Zap className="w-3 h-3" />;
        case 'Droplet': return <Droplet className="w-3 h-3" />;
        case 'Dumbbell': return <Dumbbell className="w-3 h-3" />;
        case 'Scale': return <Scale className="w-3 h-3" />;
        default: return <Star className="w-3 h-3" />;
    }
  };

  // Effect to handle Auto-Sync on mount and Interval
  useEffect(() => {
    let intervalId: any;

    const performAutoSync = () => {
        if (profile.googleFitSync && GoogleFitService.isTokenAvailable()) {
            const lastSync = profile.lastFitSync || 0;
            const now = Date.now();
            // Sync if more than configured interval ago
            if (now - lastSync > AUTO_SYNC_INTERVAL_MS) {
                console.log("Triggering auto-sync (3h interval passed)");
                handleSyncGoogleFit(false);
            }
        }
    };

    // 1. Check immediately on mount
    performAutoSync();

    // 2. Set interval to check every 3 hours while app is open
    if (profile.googleFitSync) {
        intervalId = setInterval(() => {
            console.log("Triggering interval sync");
            handleSyncGoogleFit(false);
        }, AUTO_SYNC_INTERVAL_MS);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [profile.googleFitSync, profile.lastFitSync]);

  useEffect(() => {
    const data = [];
    const weeks = profile.goalWeeks || 12;
    const startWeight = profile.startWeight || profile.weightKg; 
    const currentWeight = profile.weightKg;
    const endWeight = profile.targetWeightKg || startWeight;
    const diff = startWeight - endWeight;
    const lossPerWeek = diff / weeks;
    
    let startDate = new Date();
    if (profile.goalStartDate) {
        const [y, m, d] = profile.goalStartDate.split('-').map(Number);
        startDate = new Date(y, m - 1, d);
    }
    startDate.setHours(0,0,0,0);
    
    const weightHistory = profile.weightHistory || [];

    let percent = 0;
    if (Math.abs(startWeight - endWeight) > 0) {
        percent = ((startWeight - currentWeight) / (startWeight - endWeight)) * 100;
    }
    percent = Math.max(0, percent);
    setProgressPercent(percent);

    for (let i = 0; i <= weeks; i++) {
      const idealWeight = Number((startWeight - (lossPerWeek * i)).toFixed(1));
      const weekDate = new Date(startDate);
      weekDate.setDate(weekDate.getDate() + (i * 7));
      const weekEndDate = new Date(weekDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);
      let realWeight = null;
      const pastLogs = weightHistory.filter(h => {
         const [hy, hm, hd] = h.date.split('-').map(Number);
         const hDate = new Date(hy, hm - 1, hd);
         return hDate <= weekEndDate;
      });

      if (pastLogs.length > 0) {
          const logsInWeek = weightHistory.filter(h => {
             const [hy, hm, hd] = h.date.split('-').map(Number);
             const d = new Date(hy, hm - 1, hd);
             
             const weekStart = new Date(weekDate);
             weekStart.setDate(weekStart.getDate() - 3); 
             const weekEnd = new Date(weekDate);
             weekEnd.setDate(weekEnd.getDate() + 3);
             return d >= weekStart && d <= weekEnd;
          });
          if (logsInWeek.length > 0) realWeight = logsInWeek[logsInWeek.length - 1].weight;
          else if (i === 0) realWeight = startWeight; 
      }
      data.push({
        semana: i,
        ideal: idealWeight,
        real: realWeight, 
        meta: endWeight
      });
    }
    setChartData(data);
  }, [profile]);

  useEffect(() => {
    let savings = 0;
    history.forEach(item => {
        if (item.costo_analisis && item.costo_analisis.ahorro > 0) {
            savings += item.costo_analisis.ahorro;
        }
    });
    setTotalSavings(parseFloat(savings.toFixed(2)));
    if (profile.currency && CURRENCY_SYMBOLS[profile.currency]) {
        setCurrencySymbol(CURRENCY_SYMBOLS[profile.currency]);
    } else {
        setCurrencySymbol('$');
    }
  }, [history, profile.currency]);

  useEffect(() => {
    setNotificationsEnabled(profile.enableNotifications);
  }, [profile.enableNotifications]);

  const handleEnableNotifications = async () => {
    setStatusMsg(null);
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
      onUpdateProfile({ ...profile, enableNotifications: true });
      sendDailyReminder(lang === 'en' ? "Notifications Enabled!" : "¡Notificaciones Activadas!", "NutriSnap");
      scheduleReminders(profile);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const executeGoogleFitSync = async (isManual = false) => {
      let msg = "";
      
      // 1. Get Steps
      const steps = await GoogleFitService.getDailySteps();
      if (steps > 0) {
          const today = getLocalTodayString();
          const alreadyLogged = exerciseHistory.some(e => e.dateString === today && e.type === 'Google Fit Steps');
          
          if (!alreadyLogged) {
              onLogExercise('Google Fit Steps', steps, 'steps', 'google_fit');
              msg += `${steps} steps. `;
          } else {
              // Optionally update existing logic handled in App.tsx but simpler to just skip
          }
      }

      // 2. Get Sleep (Targeting previous night with robust aggregation)
      const sleep = await GoogleFitService.getSleepSession();
      if (sleep > 0) {
          const today = getLocalTodayString();
          const currentLogs = profile.dailyLogs || [];
          const todayLogIndex = currentLogs.findIndex(l => l.date === today);
          
          let newLogs = [...currentLogs];
          if (todayLogIndex >= 0) {
              newLogs[todayLogIndex] = { ...newLogs[todayLogIndex], sleepHours: sleep };
          } else {
              newLogs.push({ date: today, mood: 'neutral', sleepHours: sleep });
          }
          onUpdateProfile({ ...profile, dailyLogs: newLogs, lastFitSync: Date.now() });
          msg += `Sleep: ${sleep}h.`;
      } else {
          onUpdateProfile({ ...profile, lastFitSync: Date.now() });
      }

      if (isManual) {
          alert(msg ? `Sync Complete: ${msg}` : (lang === 'en' ? "Synced. No new data found." : "Sincronizado. Sin datos nuevos."));
      }
  };

  const handleSyncGoogleFit = async (isManual = false) => {
      setIsSyncingFit(true);
      try {
          await executeGoogleFitSync(isManual);
      } catch (error: any) {
          if (isManual) {
              console.log("Sync error:", error.message);
              if (error.message === 'NO_TOKEN' || error.message === 'UNAUTHORIZED') {
                  try {
                      const connection = await GoogleFitService.connect();
                      if (connection.success) {
                          await executeGoogleFitSync(isManual); 
                      } else {
                          alert(lang === 'en' 
                              ? `Failed to connect to Google Fit: ${connection.error}` 
                              : `No se pudo conectar a Google Fit: ${connection.error}`);
                      }
                  } catch (retryError) {
                      console.error("Retry failed:", retryError);
                  }
              }
          } else {
              console.warn("Auto-sync skipped: Token missing or invalid.");
          }
      } finally {
          setIsSyncingFit(false);
      }
  };
  
  const submitExercise = (e: React.FormEvent) => {
      e.preventDefault();
      onLogExercise(exType, Number(exAmount), profile.exerciseUnit, 'manual');
      setIsExerciseModalOpen(false);
  };

  const submitWeight = (e: React.FormEvent) => {
      e.preventDefault();
      if (onLogWeight) {
          onLogWeight(Number(weightInput), weightDateInput);
      }
      setIsWeightModalOpen(false);
  };

  const submitSleep = (e: React.FormEvent) => {
      e.preventDefault();
      const newSleep = Number(sleepInput);
      const targetDate = sleepDateInput;
      
      const currentLogs = profile.dailyLogs || [];
      const index = currentLogs.findIndex(l => l.date === targetDate);
      let updatedLogs = [...currentLogs];

      if (index >= 0) {
          updatedLogs[index] = { ...updatedLogs[index], sleepHours: newSleep };
      } else {
          updatedLogs.push({ date: targetDate, mood: 'neutral', sleepHours: newSleep });
      }

      onUpdateProfile({ ...profile, dailyLogs: updatedLogs });
      setIsSleepModalOpen(false);
  };

  const todayString = getLocalTodayString();
  const todayExercises = exerciseHistory.filter(e => e.dateString === todayString);
  
  // 1. Sum up manual duration
  const manualExerciseMinutes = todayExercises
    .filter(e => e.type !== 'Google Fit Steps')
    .reduce((sum, e) => sum + e.amount, 0); 
    
  // 2. Get Step Count
  const fitStepsTotal = todayExercises
    .filter(e => e.type === 'Google Fit Steps')
    .reduce((sum, e) => sum + e.amount, 0);

  // 3. Convert Steps to Minutes (approximate)
  const stepsEquivalentMinutes = Math.floor(fitStepsTotal / STEPS_TO_MINUTES_RATIO);

  // 4. Combined Total
  const totalDailyActivity = manualExerciseMinutes + stepsEquivalentMinutes;

  const todayLog = profile.dailyLogs?.find(l => l.date === todayString);
  const displayedSleep = todayLog?.sleepHours;

  // --- SHARE CARD GENERATION HELPERS ---

  const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, fontWeight = "bold", color = "#1f2937", align: CanvasTextAlign = "center") => {
      ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
  };

  const drawCircleStat = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, icon: string, colorBg: string, colorText: string) => {
      ctx.beginPath();
      ctx.arc(x, y, 60, 0, 2 * Math.PI);
      ctx.fillStyle = colorBg;
      ctx.fill();
      drawText(ctx, icon, x, y - 5, 40);
      drawText(ctx, value, x, y + 25, 20, "bold", colorText);
      drawText(ctx, label, x, y + 90, 16, "500", "#6b7280");
  };

  const generateDailyCard = async () => {
      setIsSharingDaily(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#ecfdf5');
      gradient.addColorStop(1, '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      drawText(ctx, t.share_daily_card_title, canvas.width / 2, 150, 60, "800", "#065f46");
      drawText(ctx, new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long' }), canvas.width / 2, 220, 36, "500", "#059669");

      // Stats
      const statsY = 500;
      // Water
      drawCircleStat(ctx, 300, statsY, t.share_stats_water, `${todayWater}/${profile.waterGlasses}`, "💧", "#dbeafe", "#1e40af");
      // Exercise
      drawCircleStat(ctx, 540, statsY, t.share_stats_exercise, `${totalDailyActivity} min`, "🏃", "#ffedd5", "#c2410c");
      // Streak
      drawCircleStat(ctx, 780, statsY, t.share_stats_streak, `${profile.currentStreak || 0} ${t.tracker_streak}`, "🔥", "#fae8ff", "#86198f");

      // Mood/Vibe
      drawText(ctx, mascotCondition === 'super' ? "⚡ SUPER MODE ⚡" : mascotCondition === 'sleepy' ? "💤 Sleepy Mode" : "🌿 NutriSnap Life", canvas.width / 2, 800, 40, "bold", "#10b981");

      // Footer Branding
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
      drawText(ctx, "NutriSnap AI", canvas.width / 2, canvas.height - 50, 40, "bold", "#ffffff");

      canvas.toBlob(async (blob) => {
          if (blob) {
              const file = new File([blob], "nutrisnap-daily.png", { type: "image/png" });
              if (navigator.share) {
                  try {
                      await navigator.share({ title: t.share_daily_card_title, files: [file] });
                  } catch (e) { console.error(e); }
              } else {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = "nutrisnap-daily.png";
                  a.click();
              }
          }
          setIsSharingDaily(false);
      });
  };

  const generateGoalCard = async () => {
      setIsSharingGoal(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#eef2ff');
      gradient.addColorStop(1, '#e0e7ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      drawText(ctx, t.share_goal_card_title, canvas.width / 2, 150, 60, "900", "#312e81");

      // Big Percentage Ring
      const centerX = canvas.width / 2;
      const centerY = 450;
      const radius = 220;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = 40;
      ctx.strokeStyle = "#e0e7ff";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, (2 * Math.PI * (progressPercent / 100)) - 0.5 * Math.PI);
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#4f46e5";
      ctx.stroke();

      drawText(ctx, `${progressPercent.toFixed(0)}%`, centerX, centerY + 30, 120, "900", "#312e81");
      drawText(ctx, "COMPLETED", centerX, centerY + 100, 24, "bold", "#6366f1");

      // Detail Grid
      const startW = profile.startWeight || profile.weightKg;
      const currW = profile.weightKg;
      const goalW = profile.targetWeightKg;
      const boxY = 820;

      const drawStatBox = (x: number, label: string, val: string) => {
          drawText(ctx, label, x, boxY, 24, "bold", "#6b7280");
          drawText(ctx, val, x, boxY + 50, 40, "900", "#111827");
      };

      drawStatBox(250, t.share_stats_start, `${startW}kg`);
      drawStatBox(540, t.share_stats_current, `${currW}kg`);
      drawStatBox(830, t.share_stats_goal, `${goalW}kg`);

      // Footer
      ctx.fillStyle = "#312e81";
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
      drawText(ctx, "NutriSnap Journey", canvas.width / 2, canvas.height - 40, 30, "bold", "#ffffff");

      canvas.toBlob(async (blob) => {
          if (blob) {
              const file = new File([blob], "nutrisnap-goal.png", { type: "image/png" });
              if (navigator.share) {
                  try {
                      await navigator.share({ title: t.share_goal_card_title, files: [file] });
                  } catch (e) { console.error(e); }
              } else {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = "nutrisnap-goal.png";
                  a.click();
              }
          }
          setIsSharingGoal(false);
      });
  };

  return (
    <div className="w-full animate-fade-in mt-16 sm:mt-8 mb-8 relative">
      <div className="bg-white rounded-3xl shadow-lg border border-indigo-50 overflow-hidden relative z-10">
        <div className="bg-indigo-600 px-6 py-5">
           <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                 <div className="bg-white/20 p-2 rounded-xl shrink-0"><Trophy className="w-6 h-6 text-white" /></div>
                 <div className="min-w-0">
                   <h3 className="font-bold text-lg leading-tight text-white flex items-center gap-2">
                       Lvl {gamification.level}
                       <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded text-indigo-100 font-normal hidden sm:inline-block">
                           {gamification.xp} XP
                       </span>
                   </h3>
                   <div className="w-32 md:w-48 h-1.5 bg-indigo-800 rounded-full mt-1.5 overflow-hidden">
                       <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}></div>
                   </div>
                 </div>
              </div>
              <button onClick={() => setIsDashboardOpen(true)} className="p-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white transition-colors" title={t.tracker_dashboard}>
                  <LayoutDashboard className="w-5 h-5" />
              </button>
           </div>
        </div>

        {gamification.unlockedBadges.length > 0 && (
            <div className="bg-indigo-50 px-6 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar border-b border-indigo-100">
                <div className="flex items-center gap-2">
                    {gamification.unlockedBadges.map(badgeId => {
                        const badge = BADGES.find(b => b.id === badgeId);
                        if (!badge) return null;
                        const badgeNameKey = `badge_${badgeId}_name`;
                        // @ts-ignore
                        const badgeName = t[badgeNameKey] || badge.name;
                        return (
                            <div key={badgeId} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-indigo-100 shadow-sm">
                                <div className="text-yellow-500">{getBadgeIcon(badge.icon)}</div>
                                <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{badgeName}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="grid md:grid-cols-12 gap-0">
            <div className="md:col-span-7 p-6 border-b md:border-b-0 md:border-r border-indigo-50">
               <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-700 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                    {t.tracker_projection}
                  </h4>
                  <div className="flex items-center gap-2">
                     <button onClick={generateGoalCard} disabled={isSharingGoal} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title={t.share_goal_btn}>
                        {isSharingGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                     </button>
                     {onLogWeight && (
                        <button onClick={() => setIsWeightModalOpen(true)} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1">
                            <Scale className="w-3 h-3" /> {t.tracker_weight_btn}
                        </button>
                     )}
                     <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
                        {progressPercent > 0 ? `${progressPercent.toFixed(0)}%` : '0%'}
                    </span>
                  </div>
               </div>
               
               <div className="flex flex-row items-center gap-4">
                   <div className="h-[240px] w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                            <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="semana" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={Math.floor(profile.goalWeeks / 4)} />
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorIdeal)" />
                            <Line connectNulls type="monotone" dataKey="real" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                        </ComposedChart>
                        </ResponsiveContainer>
                   </div>
               </div>
            </div>

            <div className="md:col-span-5 bg-gray-50/50 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        {t.tracker_commitments}
                      </h4>
                      <div className="flex items-center gap-2">
                          <button onClick={generateDailyCard} disabled={isSharingDaily} className="p-1.5 bg-white text-indigo-600 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors" title={t.share_daily_btn}>
                             {isSharingDaily ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
                          </button>
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <span className="text-xs font-bold text-gray-700">{profile.currentStreak || 0} {t.tracker_streak}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="space-y-3">
                     {/* Google Fit Integration Buttons */}
                     {profile.googleFitSync && (
                         <div className="flex justify-end">
                             <button 
                                 onClick={() => handleSyncGoogleFit(true)}
                                 className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold hover:bg-blue-200 transition-colors"
                                 disabled={isSyncingFit}
                             >
                                 <RefreshCw className={`w-3 h-3 ${isSyncingFit ? 'animate-spin' : ''}`} />
                                 {isSyncingFit ? t.tracker_syncing : t.tracker_sync_btn}
                             </button>
                         </div>
                     )}

                     <div className="bg-teal-50 p-3 rounded-xl border border-teal-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm"><PiggyBank className="w-4 h-4" /></div>
                                <div><p className="text-sm font-bold text-teal-900">{t.tracker_savings_card}</p><p className="text-xs text-teal-600">{t.tracker_savings_sub}</p></div>
                            </div>
                            <span className="font-black text-lg text-teal-700">{currencySymbol}{totalSavings}</span>
                        </div>
                     </div>
                     <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-500"><Droplet className="w-4 h-4" /></div>
                                <div><p className="text-sm font-bold text-gray-700">{t.tracker_water}</p><p className="text-xs text-gray-500">{t.tracker_water_goal.replace('{amount}', profile.waterGlasses.toString())}</p></div>
                            </div>
                            <div className="flex items-center gap-2">
                                {onLogWater && (
                                    <>
                                        <button onClick={() => onLogWater(-1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold" disabled={todayWater <= 0}><Minus className="w-3 h-3" /></button>
                                        <span className="font-bold text-lg text-blue-900 w-6 text-center">{todayWater}</span>
                                        <button onClick={() => onLogWater(1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"><Plus className="w-3 h-3" /></button>
                                    </>
                                )}
                            </div>
                         </div>
                         <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (todayWater / profile.waterGlasses) * 100)}%` }}></div></div>
                     </div>
                     
                     {/* Exercise Card */}
                     <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-full text-orange-500"><Activity className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700">{t.tracker_exercise}</p>
                                    <p className="text-xs text-gray-500">
                                        {t.tracker_exercise_today} <span className="font-bold text-orange-600">{totalDailyActivity}</span> / {profile.exerciseAmount} {profile.exerciseUnit}
                                    </p>
                                    {fitStepsTotal > 0 && (
                                        <p className="text-[10px] text-blue-500 font-medium flex items-center gap-1 mt-0.5">
                                            <Footprints className="w-3 h-3" /> {fitStepsTotal} steps (~{stepsEquivalentMinutes} min)
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setIsExerciseModalOpen(true)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                        {/* Progress bar uses TOTAL combined activity */}
                        <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalDailyActivity / profile.exerciseAmount) * 100)}%` }}></div></div>
                     </div>

                     {/* Sleep Card - Always visible now to allow manual entry */}
                     <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-sm">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <div className="bg-white p-2 rounded-full text-indigo-500 shadow-sm"><Moon className="w-4 h-4" /></div>
                                 <div>
                                     <p className="text-sm font-bold text-indigo-900">{t.tracker_sleep_card_title}</p>
                                     <p className="text-xs text-indigo-600">
                                         {displayedSleep ? t.tracker_sleep_recorded.replace('{hours}', displayedSleep.toString()) : t.tracker_sleep_no_data}
                                     </p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 {displayedSleep && (
                                     <span className="font-bold text-lg text-indigo-700">{displayedSleep}h</span>
                                 )}
                                 <button onClick={() => setIsSleepModalOpen(true)} className="p-1.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-colors">
                                     <Plus className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                         {displayedSleep ? (
                             <div className="mt-2 w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full transition-all duration-500 ${displayedSleep >= profile.sleepHours ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (displayedSleep / profile.sleepHours) * 100)}%` }}></div>
                             </div>
                         ) : (
                             <div className="mt-2 flex justify-between items-center text-[10px] text-indigo-400 font-medium">
                                 <span>{t.tracker_sleep_goal.replace('{hours}', profile.sleepHours.toString())}</span>
                                 <span className="cursor-pointer hover:underline" onClick={() => setIsSleepModalOpen(true)}>{t.tracker_log_manual}</span>
                             </div>
                         )}
                     </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                    {!notificationsEnabled ? (
                        <button onClick={handleEnableNotifications} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm font-bold active:scale-95"><Bell className="w-4 h-4" />{t.tracker_notifications_btn}</button>
                    ) : (
                        <div className="bg-emerald-100 text-emerald-700 px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-emerald-200 shadow-sm"><CheckCircle2 className="w-4 h-4" />{t.tracker_notifications_active}</div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <HistoryDashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
        profile={profile} 
        history={history} 
        lang={lang} 
      />

      {isExerciseModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{zIndex: 9999}}>
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Activity className="w-5 h-5 text-orange-500" /> {t.modal_log_activity}</h3>
                      <button onClick={() => setIsExerciseModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={submitExercise} className="space-y-4">
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.label_activity}</label><select value={exType} onChange={(e) => setExType(e.target.value)} className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500"><option value={profile.exerciseType}>{profile.exerciseType}</option><option value="Caminata">{t.ex_walking}</option><option value="Correr">{t.ex_running}</option><option value="Gimnasio">{t.ex_gym}</option><option value="Deportes">{t.ex_sports}</option></select></div>
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.label_amount} ({profile.exerciseUnit})</label><div className="relative"><input type="number" inputMode="decimal" value={exAmount} onChange={(e) => setExAmount(e.target.value)} className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-orange-500 pl-10" autoFocus /><Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /></div></div>
                      <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg">{t.btn_save}</button>
                  </form>
              </div>
          </div>, document.body
      )}

      {isWeightModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{zIndex: 9999}}>
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-500" /> {t.modal_log_weight}</h3><button onClick={() => setIsWeightModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button></div>
                  <form onSubmit={submitWeight} className="space-y-4">
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.label_date}</label><input type="date" value={weightDateInput} onChange={(e) => setWeightDateInput(e.target.value)} className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" max={getLocalTodayString()} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.label_weight}</label><div className="relative"><input type="number" inputMode="decimal" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500 pl-10" autoFocus step="0.1" /><Scale className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /></div></div>
                      <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">{t.btn_save}</button>
                  </form>
              </div>
          </div>, document.body
      )}

      {isSleepModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{zIndex: 9999}}>
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Moon className="w-5 h-5 text-indigo-500" /> {t.modal_log_sleep}</h3>
                      <button onClick={() => setIsSleepModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={submitSleep} className="space-y-4">
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.label_date}</label><input type="date" value={sleepDateInput} onChange={(e) => setSleepDateInput(e.target.value)} className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" max={getLocalTodayString()} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.label_hours}</label><div className="relative"><input type="number" inputMode="decimal" value={sleepInput} onChange={(e) => setSleepInput(e.target.value)} className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500 pl-10" autoFocus step="0.5" max="24" /><Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /></div></div>
                      <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">{t.btn_save}</button>
                  </form>
              </div>
          </div>, document.body
      )}
    </div>
  );
};