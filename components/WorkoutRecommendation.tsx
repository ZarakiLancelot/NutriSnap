
import React, { useMemo, useState, useEffect } from 'react';
import { UserProfile, WorkoutRoutine } from '../types';
import { WORKOUT_DATABASE } from '../data/workoutData';
import { Dumbbell, Clock, Repeat, Flame, ChevronDown, ChevronUp, Info, RefreshCw, Star } from 'lucide-react';
import { translations } from '../data/translations';

interface WorkoutRecommendationProps {
  profile: UserProfile;
  lang?: 'es' | 'en';
}

export const WorkoutRecommendation: React.FC<WorkoutRecommendationProps> = ({ profile, lang = 'es' }) => {
  const [expanded, setExpanded] = useState(false);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const t = translations[lang];

  // Helper to get text based on lang
  const getTxt = (es: string, en?: string) => (lang === 'en' && en) ? en : es;

  const rankedWorkouts = useMemo(() => {
    // 1. Calculate scores for all workouts based on profile
    let scoredWorkouts = WORKOUT_DATABASE.map(workout => {
      let score = 0;
      let reasonKey = '';
      
      // Goal Matching
      if (profile.targetWeightKg < profile.weightKg) {
        // Weight Loss
        if (workout.tags.includes('weight_loss') || workout.tags.includes('cardio')) {
            score += 5;
            reasonKey = 'goal';
        }
        if (workout.tags.includes('tone')) score += 3;
      } else if (profile.targetWeightKg > profile.weightKg) {
        // Muscle Gain
        if (workout.tags.includes('muscle_gain') || workout.tags.includes('strength')) {
            score += 5;
            reasonKey = 'goal';
        }
      } else {
        // Maintain/Tone
        if (workout.tags.includes('tone')) {
            score += 5;
            reasonKey = 'goal';
        }
      }

      // Experience Level (Proxied by exercise frequency)
      if (profile.exerciseDays <= 2 && workout.tags.includes('beginner')) {
          score += 5;
          if (!reasonKey) reasonKey = 'level';
      }
      if (profile.exerciseDays >= 5 && workout.level === 'III') {
          score += 3;
          if (!reasonKey) reasonKey = 'level';
      }

      return { workout, score, reasonKey };
    });

    // 2. Sort by score descending
    scoredWorkouts.sort((a, b) => b.score - a.score);

    // 3. Take the top 5
    return scoredWorkouts.slice(0, 5);
  }, [profile]);

  // Use current day to pick the initial offset, but allow user to shuffle
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const selectedItem = useMemo(() => {
      if (rankedWorkouts.length === 0) return null;
      // Combine day-based rotation with manual shuffle
      const index = (dayOfYear + shuffleIndex) % rankedWorkouts.length;
      return rankedWorkouts[index];
  }, [rankedWorkouts, dayOfYear, shuffleIndex]);

  const handleShuffle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShuffleIndex(prev => prev + 1);
  };

  if (!selectedItem) return null;

  const { workout: recommendedWorkout, reasonKey } = selectedItem;

  // Format reason string
  let reasonText = "";
  if (reasonKey === 'goal') {
      const goal = profile.targetWeightKg < profile.weightKg 
        ? (lang === 'en' ? 'Weight Loss' : 'Pérdida de Peso') 
        : (profile.targetWeightKg > profile.weightKg ? (lang === 'en' ? 'Muscle Gain' : 'Ganar Músculo') : (lang === 'en' ? 'Toning' : 'Tonificar'));
      reasonText = t.workout_reason_goal.replace('{goal}', goal);
  } else if (reasonKey === 'level') {
      reasonText = t.workout_reason_level;
  }

  return (
    <div className="w-full mt-8 animate-fade-in pb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{t.workout_suggestion_title}</h3>
        </div>
        <button 
            onClick={handleShuffle}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
        >
            <RefreshCw className="w-3 h-3" /> {t.workout_refresh}
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-indigo-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
        {/* Match Badge */}
        {reasonText && (
            <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl z-10 flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-current" /> {reasonText}
            </div>
        )}

        {/* Header */}
        <div className="bg-indigo-50 p-4 pt-8 border-b border-indigo-100 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div>
                <h4 className="text-xl font-black text-indigo-900 uppercase tracking-tight">
                    {getTxt(recommendedWorkout.title, recommendedWorkout.titleEn)}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-200">
                        {t.workout_level} {recommendedWorkout.level}
                    </span>
                    <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" /> {getTxt(recommendedWorkout.focus, recommendedWorkout.focusEn)}
                    </span>
                </div>
            </div>
            <div className="text-indigo-400">
                {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 divide-x divide-indigo-50 border-b border-indigo-50 bg-white">
            <div className="p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">{t.workout_sets}</p>
                <p className="text-lg font-bold text-gray-800">{recommendedWorkout.sets}</p>
            </div>
            <div className="p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">{t.workout_rest}</p>
                <p className="text-lg font-bold text-gray-800">{getTxt(recommendedWorkout.restBetweenSets, recommendedWorkout.restBetweenSetsEn)}</p>
            </div>
            <div className="p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">{t.workout_exercises}</p>
                <p className="text-lg font-bold text-gray-800">{recommendedWorkout.exercises.length}</p>
            </div>
        </div>

        {/* Exercises List (Collapsible) */}
        {expanded && (
            <div className="p-4 bg-white animate-fade-in">
                <div className="space-y-4">
                    {recommendedWorkout.exercises.map((ex, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                            <div className="mt-1 min-w-[24px] h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-bold text-gray-800">{getTxt(ex.name, ex.nameEn)}</p>
                                    <span className="text-sm font-bold text-indigo-500">{getTxt(ex.reps, ex.repsEn)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <Info className="w-3 h-3 inline mr-1 text-gray-400" />
                                    {getTxt(ex.instruction, ex.instructionEn)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 italic">{t.workout_source}</p>
                </div>
            </div>
        )}
        
        {!expanded && (
            <div className="p-3 bg-white text-center text-xs text-indigo-400 font-medium cursor-pointer hover:bg-indigo-50 transition-colors" onClick={() => setExpanded(true)}>
                {t.workout_view_guide}
            </div>
        )}
      </div>
    </div>
  );
};
