
import { Badge, BadgeId, GamificationStats, UserProfile, HistoryItem, ExerciseLog } from '../types';

export const BADGES: Badge[] = [
  { id: 'first_scan', name: 'Explorador', description: 'Primer análisis de comida completado', icon: 'Search', xpReward: 50 },
  { id: 'streak_3', name: 'En Racha', description: '3 días seguidos registrando actividad', icon: 'Flame', xpReward: 100 },
  { id: 'streak_7', name: 'Imparable', description: '7 días seguidos de actividad', icon: 'Zap', xpReward: 300 },
  { id: 'water_master', name: 'Hidratado', description: 'Registraste más de 50 vasos de agua en total', icon: 'Droplet', xpReward: 150 },
  { id: 'gym_rat', name: 'Atleta', description: '5 sesiones de ejercicio registradas', icon: 'Dumbbell', xpReward: 200 },
  { id: 'balanced_eater', name: 'Equilibrado', description: 'Registraste 5 comidas balanceadas', icon: 'Scale', xpReward: 150 },
];

export const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 4000, 8000, 15000];

export const calculateLevel = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

export const getNextLevelXp = (currentLevel: number): number => {
  return LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 1.5;
};

export const checkNewBadges = (
  currentStats: GamificationStats, 
  foodHistory: HistoryItem[], 
  exerciseHistory: ExerciseLog[], 
  currentStreak: number
): BadgeId[] => {
  const newBadges: BadgeId[] = [];
  const existing = new Set(currentStats.unlockedBadges);

  // 1. First Scan
  if (!existing.has('first_scan') && foodHistory.length > 0) {
    newBadges.push('first_scan');
  }

  // 2. Streaks
  if (!existing.has('streak_3') && currentStreak >= 3) newBadges.push('streak_3');
  if (!existing.has('streak_7') && currentStreak >= 7) newBadges.push('streak_7');

  // 3. Water Master
  if (!existing.has('water_master') && currentStats.totalWaterLogs >= 50) newBadges.push('water_master');

  // 4. Gym Rat
  if (!existing.has('gym_rat') && exerciseHistory.length >= 5) newBadges.push('gym_rat');

  // 5. Balanced Eater
  if (!existing.has('balanced_eater')) {
     const balancedCount = foodHistory.filter(h => h.balanceado).length;
     if (balancedCount >= 5) newBadges.push('balanced_eater');
  }

  return newBadges;
};

export const addXp = (profile: UserProfile, amount: number): UserProfile => {
  const newXp = profile.gamification.xp + amount;
  const newLevel = calculateLevel(newXp);
  
  return {
    ...profile,
    gamification: {
      ...profile.gamification,
      xp: newXp,
      level: newLevel
    }
  };
};

export const processGamificationAction = (
  profile: UserProfile, 
  action: 'food' | 'water' | 'exercise', 
  foodHistory: HistoryItem[],
  exerciseHistory: ExerciseLog[]
): { updatedProfile: UserProfile, newBadges: Badge[] } => {
  
  let xpGain = 0;
  let stats = { ...profile.gamification };

  if (action === 'food') {
    xpGain = 50;
    stats.totalFoodLogs += 1;
  } else if (action === 'water') {
    xpGain = 5; // Per glass/action
    stats.totalWaterLogs += 1;
  } else if (action === 'exercise') {
    xpGain = 30;
    stats.totalExerciseLogs += 1;
  }

  stats.xp += xpGain;
  stats.level = calculateLevel(stats.xp);

  const newBadgeIds = checkNewBadges(stats, foodHistory, exerciseHistory, profile.currentStreak || 0);
  
  // Add badge XP
  newBadgeIds.forEach(bid => {
    const badge = BADGES.find(b => b.id === bid);
    if (badge) stats.xp += badge.xpReward;
  });
  
  // Recalculate level in case badges pushed it up
  stats.level = calculateLevel(stats.xp);
  stats.unlockedBadges = [...stats.unlockedBadges, ...newBadgeIds];

  const updatedProfile = { ...profile, gamification: stats };
  const earnedBadges = BADGES.filter(b => newBadgeIds.includes(b.id));

  return { updatedProfile, newBadges: earnedBadges };
};
