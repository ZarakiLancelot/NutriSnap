
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Info, Apple, Leaf, Utensils, ScanLine, AlertTriangle, Sparkles, Brain, Search, X, Circle, User, Award, LogOut, Cloud, RefreshCw, Languages, Swords, Clock } from 'lucide-react';
import { jwtDecode } from "jwt-decode";
import { analyzeFoodImage, generateWeeklyInsights } from './services/geminiService';
import { NutritionAnalysis, HistoryItem, UserProfile, ExerciseLog, WeightLog, MascotCondition, Language, DailyLog, EatingMood, MealType, FoodSource, DailyMood } from './types';
import { processGamificationAction } from './services/gamificationService';
import { SyncService, UserData } from './services/syncService';
import { GoogleFitService } from './services/googleFitService';
import { SocialService } from './services/socialService';
import { AnalysisResult } from './components/AnalysisResult';
import { HistoryList } from './components/HistoryList';
import { FullHistoryModal } from './components/FullHistoryModal';
import { ExerciseList } from './components/ExerciseList';
import { UserProfileModal } from './components/UserProfileModal';
import { Mascot } from './components/Mascot';
import { GoalTracker } from './components/GoalTracker';
import { WorkoutRecommendation } from './components/WorkoutRecommendation';
import { SplashScreen } from './components/SplashScreen';
import { NameOnboarding } from './components/NameOnboarding';
import { LoginScreen } from './components/LoginScreen';
import { MoodLogger } from './components/MoodLogger';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { translations } from './data/translations';

// Helper to get local date string YYYY-MM-DD
const getLocalTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DEFAULT_PROFILE_TEMPLATE: UserProfile = {
  name: '',
  heightCm: 170,
  weightKg: 70,
  startWeight: 0,
  age: 30,
  gender: 'male',
  currency: 'USD',
  sleepHours: 7,
  waterGlasses: 4,
  exerciseDays: 3,
  exerciseType: 'Caminata',
  exerciseAmount: 30,
  exerciseUnit: 'min',
  targetWeightKg: 65,
  goalWeeks: 12,
  isDieting: true,
  enableNotifications: false,
  googleFitSync: false,
  currentStreak: 0,
  weightHistory: [],
  dailyLogs: [],
  gamification: {
    xp: 0,
    level: 1,
    unlockedBadges: [],
    totalFoodLogs: 0,
    totalWaterLogs: 0,
    totalExerciseLogs: 0
  }
};

const CURRENCY_RATES: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GTQ': 7.8,
    'MXN': 17.0,
    'COP': 3900,
    'ARS': 850,
    'CLP': 980,
    'PEN': 3.75,
    'UYU': 39,
    'DOP': 59
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [language, setLanguage] = useState<Language>('es');

  const [image, setImage] = useState<string | null>(null);
  // Analysis can be a fresh NutritionAnalysis or an existing HistoryItem
  const [analysis, setAnalysis] = useState<(NutritionAnalysis & { id?: string, eatingMood?: EatingMood, mealType?: MealType, source?: FoodSource, realCost?: number }) | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [todayWater, setTodayWater] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{x: number, y: number} | null>(null);
  
  // Weekly Report & Mood States
  const [showMoodLogger, setShowMoodLogger] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // FAB State
  const [showFab, setShowFab] = useState(false);
  // Use state ref for callback to ensure observer attaches when element mounts
  const [actionButtonsEl, setActionButtonsEl] = useState<HTMLDivElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const t = translations[language];

  // Initialize Google Fit Client
  useEffect(() => {
    GoogleFitService.init();
  }, []);

  // Improved compression to fix database size limits
  // Reduces resolution to max 250px and quality to 0.5 for historical storage
  const compressImage = (base64Str: string, maxWidth = 250, quality = 0.5): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxWidth) {
                width *= maxWidth / height;
                height = maxWidth;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Use JPEG for optimal compression of photos
            resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
            resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  // Automatic History Sanitization
  // Checks for images larger than ~30KB and recompresses them to save DB space
  const sanitizeAndCompressHistory = async (currentHistory: HistoryItem[]) => {
      // Threshold: 40000 chars is roughly 30KB. Firestore limit is 1MB total doc.
      const LARGE_IMAGE_THRESHOLD = 40000; 
      let needsUpdate = false;
      let count = 0;

      const optimizedHistory = await Promise.all(currentHistory.map(async (item) => {
          if (item.imageBase64 && item.imageBase64.length > LARGE_IMAGE_THRESHOLD) {
              needsUpdate = true;
              count++;
              try {
                  // Re-compress very aggressively: 200px max, 0.4 quality
                  const smallImg = await compressImage(item.imageBase64, 200, 0.4); 
                  return { ...item, imageBase64: smallImg };
              } catch (e) {
                  return item;
              }
          }
          return item;
      }));

      if (needsUpdate) {
          console.log(`Optimized ${count} images in history to save space.`);
          setHistory(optimizedHistory);
          // Persist immediately to clean up Cloud/Local storage
          persistData(undefined, optimizedHistory);
          showNotification(language === 'en' ? "Database Optimized" : "Base de datos optimizada", language === 'en' ? `Compressed ${count} images.` : `Se comprimieron ${count} imágenes.`);
      }
  };

  // Monitor history for large items and clean them up
  useEffect(() => {
      if (isAuthenticated && history.length > 0) {
          const hasLargeImages = history.some(h => h.imageBase64 && h.imageBase64.length > 40000);
          if (hasLargeImages) {
              sanitizeAndCompressHistory(history);
          }
      }
  }, [isAuthenticated, history.length]); // Run when auth settles or count changes

  // Intersection Observer for FAB
  useEffect(() => {
    if (!actionButtonsEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show FAB if main buttons are NOT intersecting (not visible)
        // Only show if we are authenticated and not in camera mode
        if (!image && isAuthenticated && !isCameraOpen) {
            setShowFab(!entry.isIntersecting);
        } else {
            setShowFab(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(actionButtonsEl);

    return () => observer.disconnect();
  }, [image, isAuthenticated, isCameraOpen, actionButtonsEl]);

  // Check social partner status on load/auth
  useEffect(() => {
      const checkRival = async () => {
          if (isAuthenticated && userProfile?.social?.partnerId) {
              const today = getLocalTodayString();
              // Only check if we haven't checked today
              if (userProfile.social.lastChallengeDate !== today) {
                  const status = await SocialService.checkPartnerStatus(userProfile.social.partnerId);
                  if (status) {
                      const msg = status === 'fail' 
                          ? t.social_status_fail.replace('{name}', userProfile.social.partnerName || 'Rival')
                          : t.social_status_success.replace('{name}', userProfile.social.partnerName || 'Rival');
                      
                      showNotification(t.social_toast_title, msg);
                      
                      // Update check date so we don't spam
                      const updatedProfile = { 
                          ...userProfile, 
                          social: { 
                              ...userProfile.social, 
                              lastChallengeDate: today 
                          } 
                      };
                      setUserProfile(updatedProfile);
                      persistData(updatedProfile);
                  }
              }
          }
      };
      
      const timer = setTimeout(checkRival, 3000); // Slight delay after load
      return () => clearTimeout(timer);
  }, [isAuthenticated, userProfile?.social?.partnerId]);

  // Check if we should ask for mood (after 7 PM and not logged yet)
  useEffect(() => {
      if (userProfile) {
          const hour = new Date().getHours();
          const today = getLocalTodayString();
          const hasLoggedToday = userProfile.dailyLogs?.some(log => log.date === today);
          
          if (hour >= 19 && !hasLoggedToday) {
              // Delay slightly so it doesn't pop up immediately on load
              const timer = setTimeout(() => setShowMoodLogger(true), 3000);
              return () => clearTimeout(timer);
          }
      }
  }, [userProfile]);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('nutrisnap_lang');
      if (savedLang === 'en' || savedLang === 'es') setLanguage(savedLang);

      const savedHistory = localStorage.getItem('nutrisnap_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      
      const savedExercises = localStorage.getItem('nutrisnap_exercise_history');
      if (savedExercises) setExerciseHistory(JSON.parse(savedExercises));

      const savedProfile = localStorage.getItem('nutrisnap_profile');
      const token = localStorage.getItem('nutrisnap_token');

      if (token && savedProfile) {
         setIsAuthenticated(true);
         const parsed = JSON.parse(savedProfile);
         const decoded: any = jwtDecode(token);
         setUserId(decoded.sub || decoded.email);

         if (!parsed.gamification) parsed.gamification = DEFAULT_PROFILE_TEMPLATE.gamification;
         if (!parsed.weightHistory) parsed.weightHistory = [];
         if (!parsed.dailyLogs) parsed.dailyLogs = [];
         
         setUserProfile(parsed);
      }

      const savedWater = localStorage.getItem('nutrisnap_water_log');
      if (savedWater) {
         const { date, count } = JSON.parse(savedWater);
         const today = getLocalTodayString();
         if (date === today) setTodayWater(count);
         else setTodayWater(0);
      }
    } catch (e) {
      console.error("Error loading local data", e);
    }
  }, []);

  useEffect(() => {
      if (isAuthenticated && userId) {
          setIsSyncing(true);
          const unsubscribe = SyncService.subscribeToUserData(userId, (cloudData) => {
              console.log("☁️ Data synced");
              if (cloudData.profile) {
                  setUserProfile(cloudData.profile);
                  localStorage.setItem('nutrisnap_profile', JSON.stringify(cloudData.profile));
              }
              if (cloudData.history) {
                  setHistory(cloudData.history);
                  localStorage.setItem('nutrisnap_history', JSON.stringify(cloudData.history));
              }
              if (cloudData.exerciseHistory) {
                  setExerciseHistory(cloudData.exerciseHistory);
                  localStorage.setItem('nutrisnap_exercise_history', JSON.stringify(cloudData.exerciseHistory));
              }
              if (cloudData.waterLog) {
                  const today = getLocalTodayString();
                  if (cloudData.waterLog.date === today) {
                      setTodayWater(cloudData.waterLog.count);
                  }
                  localStorage.setItem('nutrisnap_water_log', JSON.stringify(cloudData.waterLog));
              }
              setIsSyncing(false);
          });
          return () => unsubscribe();
      }
  }, [isAuthenticated, userId]);

  const toggleLanguage = () => {
      const newLang = language === 'es' ? 'en' : 'es';
      setLanguage(newLang);
      localStorage.setItem('nutrisnap_lang', newLang);
  };

  const persistData = (
      newProfile?: UserProfile, 
      newHistory?: HistoryItem[], 
      newExercise?: ExerciseLog[],
      newWaterLog?: { date: string, count: number }
  ) => {
      if (newProfile) localStorage.setItem('nutrisnap_profile', JSON.stringify(newProfile));
      if (newHistory) localStorage.setItem('nutrisnap_history', JSON.stringify(newHistory));
      if (newExercise) localStorage.setItem('nutrisnap_exercise_history', JSON.stringify(newExercise));
      if (newWaterLog) localStorage.setItem('nutrisnap_water_log', JSON.stringify(newWaterLog));

      if (userId) {
          const payload: Partial<UserData> = {};
          if (newProfile) payload.profile = newProfile;
          if (newHistory) payload.history = newHistory;
          if (newExercise) payload.exerciseHistory = newExercise;
          if (newWaterLog) payload.waterLog = newWaterLog;
          SyncService.saveUserData(userId, payload);
      }
  };

  const handleSaveMood = (mood: DailyMood) => {
      if (!userProfile) return;
      
      const today = getLocalTodayString();
      const currentLogs = userProfile.dailyLogs || [];
      const index = currentLogs.findIndex(l => l.date === today);
      
      let updatedLogs = [...currentLogs];
      if (index >= 0) {
          updatedLogs[index] = { ...updatedLogs[index], mood };
      } else {
          updatedLogs.push({ date: today, mood, waterGlasses: todayWater });
      }
      
      const updatedProfile = { ...userProfile, dailyLogs: updatedLogs };
      setUserProfile(updatedProfile);
      persistData(updatedProfile);
      setShowMoodLogger(false);
      showNotification(language === 'en' ? "Mood Logged!" : "¡Estado registrado!", "+10 XP");
  };

  const handleUpdateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
      const index = history.findIndex(item => item.id === id);
      if (index === -1) return;

      const updatedHistory = [...history];
      updatedHistory[index] = { ...updatedHistory[index], ...updates };
      setHistory(updatedHistory);
      
      if (analysis && analysis.id === id) {
          setAnalysis({ ...analysis, ...updates });
      }

      persistData(undefined, updatedHistory);

      if (updates.mealType === 'dinner') {
          const today = getLocalTodayString();
          const hasLoggedMood = userProfile?.dailyLogs?.some(l => l.date === today);
          if (!hasLoggedMood) {
              setTimeout(() => setShowMoodLogger(true), 1000);
          }
      }
  };

  const handleGenerateReport = async () => {
      setShowReportModal(true);
      if (!userProfile) return;
      
      setIsGeneratingReport(true);
      const waterLogArray = [{ date: getLocalTodayString(), count: todayWater }]; 
      
      const report = await generateWeeklyInsights(
          history, 
          exerciseHistory, 
          userProfile.dailyLogs || [], 
          waterLogArray,
          language
      );
      
      setReportData(report);
      setIsGeneratingReport(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
        setLoadingStep(0);
        interval = setInterval(() => {
            setLoadingStep((prev) => (prev + 1) % 4);
        }, 2000); 
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleLoginSuccess = async (credential: string) => {
      try {
          const decoded: any = jwtDecode(credential);
          const newUserId = decoded.sub || decoded.email;
          setUserId(newUserId);
          localStorage.setItem('nutrisnap_token', credential);
          
          const today = getLocalTodayString();
          setIsSyncing(true);
          const cloudData = await SyncService.getUserData(newUserId);
          
          if (cloudData) {
              setUserProfile(cloudData.profile);
              setHistory(cloudData.history);
              setExerciseHistory(cloudData.exerciseHistory);
              if (cloudData.waterLog && cloudData.waterLog.date === today) {
                  setTodayWater(cloudData.waterLog.count);
              } else {
                  setTodayWater(0);
              }
              localStorage.setItem('nutrisnap_profile', JSON.stringify(cloudData.profile));
              localStorage.setItem('nutrisnap_history', JSON.stringify(cloudData.history));
              localStorage.setItem('nutrisnap_exercise_history', JSON.stringify(cloudData.exerciseHistory));
          } else {
              let currentProfile = userProfile;
              if (!currentProfile) {
                 const saved = localStorage.getItem('nutrisnap_profile');
                 currentProfile = saved ? JSON.parse(saved) : { ...DEFAULT_PROFILE_TEMPLATE };
              }
              if (currentProfile) {
                 const newProfile: UserProfile = {
                    ...currentProfile,
                    name: decoded.name || currentProfile.name,
                    email: decoded.email,
                    photoUrl: decoded.picture,
                    goalStartDate: currentProfile.goalStartDate || today,
                    weightHistory: currentProfile.weightHistory || [{ id: Date.now().toString(), date: today, weight: currentProfile.weightKg }]
                 };
                 setUserProfile(newProfile);
                 persistData(newProfile, history, exerciseHistory, { date: today, count: todayWater });
                 if (newProfile.weightKg === 70 && newProfile.heightCm === 170) {
                    setIsProfileOpen(true);
                 }
              }
          }
          setIsAuthenticated(true);
          setIsSyncing(false);
      } catch (e) {
          console.error("Login Error", e);
          setIsSyncing(false);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('nutrisnap_token');
      localStorage.removeItem('nutrisnap_profile'); 
      localStorage.removeItem('nutrisnap_history'); 
      localStorage.removeItem('nutrisnap_exercise_history'); 
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserId(null);
      window.location.reload();
  };

  const handleOnboardingComplete = (name: string) => {
      const today = getLocalTodayString();
      const newProfile = { 
          ...DEFAULT_PROFILE_TEMPLATE, 
          name,
          goalStartDate: today,
          weightHistory: [{ id: Date.now().toString(), date: today, weight: DEFAULT_PROFILE_TEMPLATE.weightKg }]
      };
      setUserProfile(newProfile);
      persistData(newProfile);
      setShowOnboarding(false);
      setIsProfileOpen(true);
  };

  const showNotification = (title: string, message: string) => {
      setNotification({ title, message });
      setTimeout(() => setNotification(null), 5000);
  };

  const determineMealType = (): MealType => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) return 'breakfast';
      if (hour >= 11 && hour < 15) return 'lunch';
      if (hour >= 18 && hour < 22) return 'dinner';
      return 'snack';
  };

  const saveToHistory = async (analysisResult: NutritionAnalysis, imageBase64: string) => {
    const defaultType = determineMealType();
    
    // Aggressive compression for storage (Max 250px, 0.5 quality)
    // Ensures new items are small
    const compressedImage = await compressImage(imageBase64, 250, 0.5);

    const newItem: HistoryItem = {
      ...analysisResult,
      id: Date.now().toString(),
      timestamp: Date.now(),
      imageBase64: compressedImage, // Saved as tiny thumb
      mealType: defaultType,
      source: 'homemade' 
    };
    
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    
    // Set current analysis view to this new item but keep high-res image in view state for now
    setAnalysis({ ...newItem, imageBase64: imageBase64 }); 

    let profileToSave = userProfile;
    if (userProfile) {
        const { updatedProfile, newBadges } = processGamificationAction(userProfile, 'food', updatedHistory, exerciseHistory);
        profileToSave = updatedProfile;
        setUserProfile(updatedProfile);
        if (newBadges.length > 0) {
            const badgeId = newBadges[0].id;
            const badgeName = t[`badge_${badgeId}_name` as keyof typeof t] || newBadges[0].name;
            showNotification(language === 'en' ? "New Badge Unlocked!" : "¡Nueva Insignia Desbloqueada!", badgeName);
        } else {
            showNotification(language === 'en' ? "Analysis Complete!" : "¡Análisis Completado!", "+50 XP");
        }
        if (userProfile.googleFitSync) {
            GoogleFitService.syncNutrition(analysisResult);
        }
    }
    persistData(profileToSave || undefined, updatedHistory);

    if (defaultType === 'dinner') {
        const today = getLocalTodayString();
        const hasLoggedMood = userProfile?.dailyLogs?.some(l => l.date === today);
        if (!hasLoggedMood) {
            setTimeout(() => setShowMoodLogger(true), 2000);
        }
    }
  };

  const handleSaveProfile = (profile: UserProfile) => {
    if (userProfile && userProfile.currency !== profile.currency && history.length > 0) {
        const oldRate = CURRENCY_RATES[userProfile.currency] || 1;
        const newRate = CURRENCY_RATES[profile.currency] || 1;
        const ratio = newRate / oldRate;

        const updatedHistory = history.map(h => {
            const newH = { ...h };
            if (newH.costo_analisis) {
                newH.costo_analisis = {
                    ...newH.costo_analisis,
                    moneda: profile.currency === 'GTQ' ? 'Q' : profile.currency === 'EUR' ? '€' : '$',
                    costo_casero_estimado: parseFloat((newH.costo_analisis.costo_casero_estimado * ratio).toFixed(2)),
                    costo_restaurante_estimado: parseFloat((newH.costo_analisis.costo_restaurante_estimado * ratio).toFixed(2)),
                    ahorro: parseFloat((newH.costo_analisis.ahorro * ratio).toFixed(2))
                };
            }
            if (newH.realCost) {
                newH.realCost = parseFloat((newH.realCost * ratio).toFixed(2));
            }
            return newH;
        });
        setHistory(updatedHistory);
        persistData(profile, updatedHistory);
    } else {
        persistData(profile);
    }
    setUserProfile(profile);
  };

  const handleLogWeight = (weight: number, date: string) => {
      if (!userProfile) return;

      // Get previous weight for comparison
      const sortedHistory = [...(userProfile.weightHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const previousWeight = sortedHistory.length > 0 ? sortedHistory[0].weight : userProfile.startWeight;
      const target = userProfile.targetWeightKg;
      
      const newLog: WeightLog = { id: Date.now().toString(), date: date, weight: weight };
      const updatedHistory = [...(userProfile.weightHistory || [])];
      const existingIndex = updatedHistory.findIndex(log => log.date === date);
      if (existingIndex >= 0) updatedHistory[existingIndex] = newLog;
      else updatedHistory.push(newLog);
      updatedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const updatedProfile = { ...userProfile, weightKg: weight, weightHistory: updatedHistory };
      handleSaveProfile(updatedProfile);

      // --- FEEDBACK LOGIC ---
      const isWeightLoss = userProfile.startWeight > target;
      const diff = weight - previousWeight; // Negative means lost weight
      const distToGoal = Math.abs(weight - target);

      let title = language === 'en' ? "Weight Logged" : "Peso Registrado";
      let msg = "";

      if (distToGoal < 0.5) {
           // Goal Reached
           title = language === 'en' ? "🎉 GOAL REACHED!" : "🎉 ¡META ALCANZADA!";
           msg = language === 'en' 
              ? "Incredible work! Your discipline has paid off. Your health is at its peak!" 
              : "¡Trabajo increíble! Tu disciplina valió la pena. ¡Tu salud está en su mejor momento!";
      } else if ((isWeightLoss && diff < 0) || (!isWeightLoss && diff > 0)) {
           // Progressing
           title = language === 'en' ? "Great Progress! 📉" : "¡Buen Progreso! 📉";
           msg = language === 'en'
              ? `Moving in the right direction. Keep it up, your heart thanks you.`
              : `Vas en la dirección correcta. Sigue así, tu corazón te lo agradece.`;
      } else if (diff === 0) {
           // Stalled
           msg = language === 'en'
              ? "Steady as a rock. Consistency is key, but let's try to push a bit more."
              : "Estable como una roca. La constancia es clave, pero intentemos empujar un poco más.";
      } else {
           // Regressing
           const severity = Math.abs(diff);
           title = language === 'en' ? "Watch Out! 👀" : "¡Ojo ahí! 👀";
           if (severity < 1.5) {
               msg = language === 'en'
                  ? "Small step back. Don't lose focus, remember why you started!"
                  : "Un pequeño paso atrás. ¡No pierdas el foco, recuerda por qué empezaste!";
           } else {
               msg = language === 'en'
                  ? "Whoa! Significant deviation. Let's get strict with the diet today. Your health needs you!"
                  : "¡Epa! Desviación importante. Pongámonos estrictos con la dieta hoy. ¡Tu salud te necesita!";
           }
      }

      showNotification(title, msg);
      
      if (userProfile.googleFitSync) {
          GoogleFitService.syncWeight(weight);
      }
  };

  const calculateStreak = (logs: ExerciseLog[]): number => {
      if (!logs || logs.length === 0) return 0;
      
      const uniqueDates = Array.from(new Set(logs.map(log => log.dateString))).sort().reverse();
      if (uniqueDates.length === 0) return 0;

      const today = getLocalTodayString();
      
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const yesterday = `${y}-${m}-${da}`;

      if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

      let streak = 1;
      
      const getUTCMidday = (dateStr: string) => {
          const [year, month, day] = dateStr.split('-').map(Number);
          return Date.UTC(year, month - 1, day, 12, 0, 0);
      };

      for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = getUTCMidday(uniqueDates[i]);
          const previous = getUTCMidday(uniqueDates[i+1]);
          const diffMs = current - previous;
          
          if (diffMs === 86400000) {
              streak++;
          } else {
              break;
          }
      }
      return streak;
  };

  useEffect(() => {
      if (userProfile && exerciseHistory.length > 0) {
          const calculated = calculateStreak(exerciseHistory);
          if (userProfile.currentStreak !== calculated) {
              const updated = { ...userProfile, currentStreak: calculated };
              setUserProfile(updated);
              persistData(updated);
          }
      }
  }, [exerciseHistory, userProfile?.currentStreak]);

  const handleLogExercise = (type: string, amount: number, unit: string, source: 'manual' | 'google_fit' = 'manual') => {
      const todayString = getLocalTodayString();
      
      if (source === 'google_fit' && type === 'Google Fit Steps') {
          const existingIndex = exerciseHistory.findIndex(e => e.dateString === todayString && e.type === 'Google Fit Steps');
          if (existingIndex >= 0) {
              const updatedHistory = [...exerciseHistory];
              updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], amount, timestamp: Date.now() };
              setExerciseHistory(updatedHistory);
              persistData(undefined, undefined, updatedHistory);
              return; 
          }
      }

      const newLog: ExerciseLog = { id: Date.now().toString(), timestamp: Date.now(), dateString: todayString, type, amount, unit, source };
      const updatedHistory = [newLog, ...exerciseHistory];
      setExerciseHistory(updatedHistory);
      let profileToSave = userProfile;
      
      if (userProfile) {
          const newStreak = calculateStreak(updatedHistory);
          let updatedProfile: UserProfile = { ...userProfile, currentStreak: newStreak, lastExerciseDate: todayString };
          
          // Update Daily Log with exercise minutes
          const currentLogs = updatedProfile.dailyLogs || [];
          const logIndex = currentLogs.findIndex(l => l.date === todayString);
          let totalMins = (amount * (unit === 'min' ? 1 : 10)); // simple conversion if needed, assumed min mostly
          
          let newLogs = [...currentLogs];
          if (logIndex >= 0) {
              const existing = newLogs[logIndex];
              newLogs[logIndex] = { ...existing, exerciseMins: (existing.exerciseMins || 0) + totalMins };
          } else {
              newLogs.push({ date: todayString, mood: 'neutral', exerciseMins: totalMins });
          }
          updatedProfile.dailyLogs = newLogs;

          if (source === 'manual') {
              const { updatedProfile: gamifiedProfile, newBadges } = processGamificationAction(updatedProfile, 'exercise', history, updatedHistory);
              updatedProfile = gamifiedProfile;
              if (newBadges.length > 0) {
                  const badgeId = newBadges[0].id;
                  const badgeName = t[`badge_${badgeId}_name` as keyof typeof t] || newBadges[0].name;
                  showNotification(language === 'en' ? "New Badge Unlocked!" : "¡Nueva Insignia Desbloqueada!", badgeName);
              } else {
                  showNotification(language === 'en' ? "Workout Logged!" : "¡Ejercicio Registrado!", "+30 XP");
              }
          }
          
          profileToSave = updatedProfile;
          setUserProfile(updatedProfile);
          
          if (source === 'manual' && userProfile.googleFitSync) {
              GoogleFitService.syncExercise(newLog);
          }
      }
      persistData(profileToSave || undefined, undefined, updatedHistory);
  };

  const handleDeleteExercise = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const updatedHistory = exerciseHistory.filter(item => item.id !== id);
      setExerciseHistory(updatedHistory);
      let profileToSave = userProfile;
      if (userProfile) {
          const newStreak = calculateStreak(updatedHistory);
          const updatedProfile = { ...userProfile, currentStreak: newStreak };
          profileToSave = updatedProfile;
          setUserProfile(updatedProfile);
      }
      persistData(profileToSave || undefined, undefined, updatedHistory);
  };

  const handleLogWater = (increment: number) => {
      const newCount = Math.max(0, todayWater + increment);
      setTodayWater(newCount);
      const today = getLocalTodayString();
      const waterLog = { date: today, count: newCount };
      
      let profileToSave = userProfile;
      if (userProfile) {
          // Update Daily Log for history persistence
          const currentLogs = userProfile.dailyLogs || [];
          const logIndex = currentLogs.findIndex(l => l.date === today);
          let newLogs = [...currentLogs];
          
          if (logIndex >= 0) {
              newLogs[logIndex] = { ...newLogs[logIndex], waterGlasses: newCount };
          } else {
              newLogs.push({ date: today, mood: 'neutral', waterGlasses: newCount });
          }
          
          let updatedProfile = { ...userProfile, dailyLogs: newLogs };

          if (increment > 0) {
              const { updatedProfile: gamifiedProfile, newBadges } = processGamificationAction(updatedProfile, 'water', history, exerciseHistory);
              updatedProfile = gamifiedProfile;
              if (newBadges.length > 0) {
                 const badgeId = newBadges[0].id;
                 const badgeName = t[`badge_${badgeId}_name` as keyof typeof t] || newBadges[0].name;
                 showNotification(language === 'en' ? "New Badge Unlocked!" : "¡Nueva Insignia Desbloqueada!", badgeName);
              } else if (newCount % 2 === 0) {
                 showNotification(language === 'en' ? "Hydrated!" : "¡Hidratación!", "+5 XP");
              }
          }
          profileToSave = updatedProfile;
          setUserProfile(updatedProfile);
      }
      persistData(profileToSave || undefined, undefined, undefined, waterLog);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    persistData(undefined, updatedHistory);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setImage(item.imageBase64);
    setAnalysis(item);
    setShowFullHistory(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHistory = (direction: 'prev' | 'next') => {
      if (!analysis || history.length === 0) return;
      const currentIndex = history.findIndex(h => h.id === analysis.id);
      if (currentIndex === -1) return;

      let nextIndex = direction === 'next' ? currentIndex - 1 : currentIndex + 1;
      
      if (nextIndex >= 0 && nextIndex < history.length) {
          handleSelectHistory(history[nextIndex]);
      }
  };

  const startCamera = async () => {
    setError(null);
    try {
      let stream;
      const constraints: MediaStreamConstraints = { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } };
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch (e) { console.error(e); }
        }
      }, 100);
    } catch (err) {
      setError("Camera access error.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setFocusPoint(null);
  };

  const handleTapToFocus = async (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setFocusPoint(null), 1500);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64String = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        processBase64(base64String);
      }
    }
  };

  const processBase64 = async (base64String: string) => {
      setImage(base64String);
      setLoading(true);
      setError(null);
      setAnalysis(null);
      const match = base64String.match(/^data:(.*);base64,(.*)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        try {
          const result = await analyzeFoodImage(base64Data, mimeType, userProfile || undefined, language);
          if (result.es_valida) {
              setAnalysis(result);
              saveToHistory(result, base64String);
          } else {
              setError(result.mensaje_error || t.error_desc);
          }
        } catch (err) {
          setError(t.error_desc);
        } finally {
          setLoading(false);
        }
      } else {
         setError("Image processing error.");
         setLoading(false);
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        setError("File too large (max 5MB).");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => { processBase64(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const resetApp = () => {
      stopCamera();
      setImage(null);
      setAnalysis(null);
      setError(null);
  };

  const loadingState = [
      { text: t.loading_scan, icon: <ScanLine className="w-8 h-8 text-emerald-500" /> },
      { text: t.loading_ingredients, icon: <Search className="w-8 h-8 text-blue-500" /> },
      { text: t.loading_nutrition, icon: <Brain className="w-8 h-8 text-purple-500" /> },
      { text: t.loading_report, icon: <Sparkles className="w-8 h-8 text-orange-500" /> }
  ];

  const todayExerciseTotal = exerciseHistory
    .filter(e => e.dateString === getLocalTodayString())
    .reduce((sum, e) => sum + e.amount, 0);

  let mascotCondition: MascotCondition = 'normal';
  if (userProfile) {
      const today = getLocalTodayString();
      const hour = new Date().getHours();
      const hasLogsToday = history.some(h => {
          const d = new Date(h.timestamp);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}` === today;
      }) || todayWater > 0 || todayExerciseTotal > 0;
      
      if (hour >= 6 && hour < 10 && !hasLogsToday) {
          mascotCondition = 'sleepy';
      } else {
          const lastMeals = history.slice(0, 3);
          const isSick = lastMeals.length > 0 && lastMeals.every(h => !h.balanceado);
          const isDehydrated = todayWater < (userProfile.waterGlasses * 0.3);
          const isSuper = todayWater >= userProfile.waterGlasses && todayExerciseTotal >= userProfile.exerciseAmount;
          if (isSuper) mascotCondition = 'super';
          else if (isSick) mascotCondition = 'sick';
          else if (isDehydrated) mascotCondition = 'dehydrated';
      }
  }

  // Calculate if navigation buttons should be active
  const currentHistoryIndex = analysis ? history.findIndex(h => h.id === analysis.id) : -1;
  const hasNext = currentHistoryIndex > 0; // newer items have lower index
  const hasPrev = currentHistoryIndex !== -1 && currentHistoryIndex < history.length - 1;

  if (showSplash) return <SplashScreen />;
  if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  if (showOnboarding) return <NameOnboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen pb-12 relative">
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-sm animate-slide-in">
            <div className={`border-l-4 shadow-xl rounded-lg p-4 flex items-start gap-3 ${notification.title === t.social_toast_title ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-yellow-400'}`}>
                <div className={`p-2 rounded-full ${notification.title === t.social_toast_title ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {notification.title === t.social_toast_title ? <Swords className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
            </div>
        </div>
      )}

      {/* Floating Action Button (Camera) */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${showFab ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <button 
          onClick={startCamera}
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-95 flex items-center justify-center"
        >
           <Camera className="w-8 h-8" />
        </button>
      </div>

      <Mascot 
         userProfile={userProfile} 
         historyCount={history.length} 
         lastAnalysis={analysis}
         todayWater={todayWater}
         todayExercise={todayExerciseTotal}
         condition={mascotCondition}
         history={history}
         lang={language}
      />

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        initialProfile={userProfile}
        onSave={handleSaveProfile}
        lang={language}
      />

      <WeeklyReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)}
        report={reportData}
        loading={isGeneratingReport}
        lang={language}
      />

      <FullHistoryModal 
        isOpen={showFullHistory}
        onClose={() => setShowFullHistory(false)}
        history={history}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        lang={language}
      />

      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
          <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start">
            <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <p className="text-xs text-white/90 font-medium">AI Mode</p>
            </div>
            <button onClick={stopCamera} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden cursor-crosshair" onClick={handleTapToFocus}>
             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
             {focusPoint && <div className="absolute border-2 border-yellow-400 rounded-full w-16 h-16 animate-focus" style={{ left: focusPoint.x, top: focusPoint.y }} />}
          </div>
          <div className="bg-black/80 backdrop-blur-sm pt-6 pb-10 px-6 flex items-center justify-center relative z-20">
            <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <header className="bg-white border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
                <div className="bg-emerald-500 text-white p-2 rounded-lg">
                    <Leaf className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">{t.app_name}</h1>
            </div>
            
            <div className="flex items-center gap-3">
                <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-gray-100 font-bold text-sm flex items-center gap-1 border border-gray-200 text-gray-700 bg-white">
                    <Languages className="w-4 h-4 text-gray-500" />
                    {language.toUpperCase()}
                </button>
                {isSyncing && <div className="animate-spin text-emerald-500 mr-2"><RefreshCw className="w-4 h-4" /></div>}
                
                {/* Permanent History Button */}
                <button onClick={() => setShowFullHistory(true)} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full border border-transparent hover:border-emerald-100 transition-all" title={t.history_full_title}>
                    <Clock className="w-5 h-5" />
                </button>

                <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100">
                    {userProfile?.photoUrl ? <img src={userProfile.photoUrl} alt="Perfil" className="w-5 h-5 rounded-full" /> : <User className="w-4 h-4" />}
                    <span className="text-sm font-medium hidden sm:inline">{userProfile?.name || t.profile}</span>
                </button>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full" title={t.logout}>
                   <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        {!image && userProfile && (
            <>
                {showMoodLogger && (
                    <MoodLogger 
                        onSave={handleSaveMood} 
                        onClose={() => setShowMoodLogger(false)} 
                        lang={language}
                    />
                )}
                <GoalTracker 
                    profile={userProfile} 
                    onUpdateProfile={handleSaveProfile} 
                    exerciseHistory={exerciseHistory}
                    onLogExercise={handleLogExercise}
                    todayWater={todayWater}
                    onLogWater={handleLogWater}
                    onLogWeight={handleLogWeight}
                    mascotCondition={mascotCondition}
                    history={history}
                    lang={language}
                />
                <ExerciseList history={exerciseHistory} onDelete={handleDeleteExercise} lang={language} />
                <WorkoutRecommendation profile={userProfile} lang={language} />
            </>
        )}

        {!image && (
            <div className="text-center py-8 px-4 animate-fade-in">
                {!userProfile ? (
                     <div className="flex flex-col items-center justify-center min-h-[50vh]"><p className="text-gray-400">Loading...</p></div>
                ) : (
                    <div className="text-left mb-8">
                       <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.hello.replace('{name}', userProfile.name.split(' ')[0])}</h2>
                       <p className="text-gray-500">{t.welcome_text}</p>
                    </div>
                )}
                {/* Updated to use callback ref for robust mounting detection */}
                <div ref={setActionButtonsEl} className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
                    <button onClick={startCamera} className="group flex-1 flex flex-col items-center justify-center p-8 bg-emerald-500 rounded-3xl text-white shadow-lg hover:bg-emerald-600 transition-all">
                        <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8" /></div>
                        <span className="font-bold text-lg">{t.camera_btn}</span>
                        <span className="text-emerald-100 text-sm mt-1">{t.camera_sub}</span>
                    </button>
                    <button onClick={triggerUpload} className="group flex-1 flex flex-col items-center justify-center p-8 bg-white border-2 border-emerald-100 rounded-3xl text-gray-700 shadow-sm hover:shadow-md transition-all">
                        <div className="bg-emerald-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8 text-emerald-500" /></div>
                        <span className="font-bold text-lg">{t.upload_btn}</span>
                        <span className="text-gray-400 text-sm mt-1">{t.upload_sub}</span>
                    </button>
                </div>
            </div>
        )}

        {image && (
             <div className="space-y-8 animate-fade-in">
                <div className="flex justify-end gap-3">
                    <button onClick={triggerUpload} disabled={loading} className={`text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors bg-white border-gray-200 text-gray-700 shadow-sm ${loading ? 'cursor-not-allowed text-gray-300' : 'hover:bg-gray-50'}`}>
                        <Upload className="w-4 h-4" /> {t.upload_btn}
                    </button>
                     <button onClick={startCamera} disabled={loading} className={`text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${loading ? 'cursor-not-allowed text-gray-300' : 'bg-emerald-500 text-white'}`}>
                        <Camera className="w-4 h-4" /> {t.camera_btn}
                    </button>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white relative">
                                <img src={image} alt="Food Analysis" className={`w-full h-auto object-cover max-h-[500px] transition-all duration-700 ${loading ? 'blur-sm' : ''}`} />
                                {loading && (
                                    <div className="absolute inset-0 bg-emerald-900/10 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="relative"><div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div><ScanLine className="relative w-12 h-12 text-white/90 animate-pulse" /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        {loading && (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-emerald-100 shadow-sm p-8">
                                <div key={loadingStep} className="z-10 bg-white p-4 rounded-full shadow-sm border border-emerald-50 mb-4">{loadingState[loadingStep].icon}</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1">{loadingState[loadingStep].text}</h3>
                                <div className="flex gap-2 mt-8">
                                    {loadingState.map((_, idx) => (
                                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${idx === loadingStep ? "w-8 bg-emerald-500" : "w-2 bg-emerald-200"}`} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {!loading && error && (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 flex flex-col items-center text-center">
                                <div className="bg-orange-100 p-4 rounded-full mb-4"><AlertTriangle className="w-8 h-8 text-orange-500" /></div>
                                <h4 className="font-bold text-gray-800 text-xl mb-2">{t.error_title}</h4>
                                <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">{error}</p>
                            </div>
                        )}
                        {!loading && analysis && (
                            <AnalysisResult 
                                data={analysis} 
                                image={image} 
                                lang={language} 
                                onUpdateMood={(id, mood) => handleUpdateHistoryItem(id, { eatingMood: mood })}
                                onUpdateMealType={(id, type) => handleUpdateHistoryItem(id, { mealType: type })}
                                onUpdateSource={(id, source, realCost) => handleUpdateHistoryItem(id, { source, realCost })}
                                onNavigate={handleNavigateHistory}
                                hasNext={hasNext}
                                hasPrev={hasPrev}
                            />
                        )}
                    </div>
                </div>
             </div>
        )}
        {!loading && !image && <HistoryList history={history} onSelect={handleSelectHistory} onDelete={handleDeleteHistory} onGenerateReport={handleGenerateReport} onViewAll={() => setShowFullHistory(true)} lang={language} />}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </main>
    </div>
  );
}

export default App;
