
export type Language = 'es' | 'en';

export type Currency = 'USD' | 'EUR' | 'GTQ' | 'MXN' | 'COP' | 'ARS' | 'PEN' | 'CLP' | 'UYU' | 'DOP';

export interface Calories {
  total: number;
  rango: string;
}

export interface Macros {
  proteina_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  fibra_g: number;
}

export interface MicroNutrient {
  nutriente: string;
  cantidad: string;
}

export interface CostAnalysis {
  costo_casero_estimado: number;
  costo_restaurante_estimado: number;
  moneda: string;
  ahorro: number;
  mensaje_ahorro: string;
}

export interface NutritionAnalysis {
  es_valida: boolean;
  mensaje_error: string;
  alimento: string;
  peso_estimado_g: number;
  calorias: Calories;
  macros: Macros;
  micros_principales: MicroNutrient[];
  costo_analisis: CostAnalysis;
  balanceado: boolean;
  analisis: string;
  recomendaciones: string[];
}

// Updated HistoryItem to include Eating Mood, Meal Type, and Source/Cost
export type EatingMood = 'hungry' | 'happy' | 'stressed' | 'bored' | 'sad';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSource = 'homemade' | 'restaurant';

export interface HistoryItem extends NutritionAnalysis {
  id: string;
  timestamp: number;
  imageBase64: string;
  eatingMood?: EatingMood; 
  mealType?: MealType; 
  source?: FoodSource; // New field: Where did the food come from?
  realCost?: number;   // New field: User input for restaurant cost
}

export type AvatarArchetype = 'bear' | 'fox' | 'tiger' | 'koala';
export type Mood = 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'suspicious' | 'sleepy';
export type MascotCondition = 'normal' | 'dehydrated' | 'sick' | 'super' | 'sleepy';

export interface ExerciseLog {
  id: string;
  timestamp: number;
  dateString: string; // YYYY-MM-DD for grouping
  type: string;
  amount: number;
  unit: string;
  source?: 'manual' | 'google_fit'; // To distinguish data source
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
}

// Daily Summary Mood Types (Overall day mood)
export type DailyMood = 'great' | 'good' | 'neutral' | 'tired' | 'bad';

export interface DailyLog {
  date: string; // YYYY-MM-DD
  mood: DailyMood;
  note?: string;
  sleepHours?: number; // Captured from Fit
  // History Tracking Fields
  waterGlasses?: number;
  exerciseMins?: number;
  totalCalories?: number;
  foodCount?: number;
}

// Gamification Types
export type BadgeId = 'first_scan' | 'streak_3' | 'streak_7' | 'water_master' | 'gym_rat' | 'balanced_eater' | 'early_bird';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string; // Lucide icon name mapping
  xpReward: number;
}

export interface GamificationStats {
  xp: number;
  level: number;
  unlockedBadges: BadgeId[];
  totalFoodLogs: number;
  totalWaterLogs: number;
  totalExerciseLogs: number;
}

export interface SocialProfile {
  partnerId?: string; // UID of the rival/friend
  partnerName?: string;
  partnerEmail?: string;
  lastChallengeDate?: string;
}

export interface UserProfile {
  name: string;
  email?: string; // Added for Google Login
  photoUrl?: string; // Added for Google Login
  heightCm: number;
  weightKg: number;
  startWeight: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  currency: Currency; // Added currency preference
  sleepHours: number;
  waterGlasses: number;
  exerciseDays: number;
  exerciseType: string;
  exerciseAmount: number; 
  exerciseUnit: 'min' | 'km';
  // Goal Fields
  targetWeightKg: number;
  goalWeeks: number;
  goalStartDate?: string; // ISO Date String of when they started the goal
  isDieting: boolean;
  enableNotifications: boolean;
  // Integrations
  googleFitSync?: boolean;
  lastFitSync?: number; // Timestamp of last read
  
  avatarArchetype?: AvatarArchetype;
  // Streak Tracking
  currentStreak?: number;
  lastExerciseDate?: string;
  // Weight History
  weightHistory?: WeightLog[];
  // Mood History
  dailyLogs?: DailyLog[];
  // Gamification
  gamification: GamificationStats;
  // Social
  social?: SocialProfile;
}

export interface WorkoutExercise {
  name: string;
  nameEn?: string;
  reps: string;
  repsEn?: string;
  instruction: string;
  instructionEn?: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  titleEn?: string;
  focus: 'Full Body' | 'Upper Body' | 'Lower Body' | 'Abs' | 'Cardio';
  focusEn?: string;
  level: 'I' | 'II' | 'III';
  sets: number;
  restBetweenSets: string;
  restBetweenSetsEn?: string;
  exercises: WorkoutExercise[];
  tags: string[]; // e.g., 'strength', 'weight_loss', 'tone'
}
