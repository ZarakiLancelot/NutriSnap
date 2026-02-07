
import { WorkoutRoutine } from '../types';

export const WORKOUT_DATABASE: WorkoutRoutine[] = [
  {
    id: 'gladiator',
    title: 'Gladiator', 
    focus: 'Full Body',
    focusEn: 'Full Body',
    level: 'II',
    sets: 5,
    restBetweenSets: '2 minutos',
    restBetweenSetsEn: '2 minutes',
    tags: ['strength', 'muscle_gain', 'male'],
    exercises: [
      { name: 'Curl de Bíceps', nameEn: 'Bicep Curls', reps: '10 reps', instruction: 'De pie con mancuernas, dobla los codos levantando el peso hacia los hombros. Controla la bajada.', instructionEn: 'Stand with dumbbells, curl upwards towards shoulders. Control the descent.' },
      { name: 'Press de Hombros', nameEn: 'Shoulder Press', reps: '10 reps', instruction: 'Mancuernas a la altura de los hombros, empuja hacia arriba hasta extender los brazos.', instructionEn: 'Dumbbells at shoulder height, push up until arms extended.' },
      { name: 'Zancadas (Lunges)', nameEn: 'Lunges', reps: '20 reps (10/pierna)', repsEn: '20 reps (10/leg)', instruction: 'Da un paso largo adelante y baja la cadera hasta que ambas rodillas estén a 90 grados.', instructionEn: 'Step forward, lower hips until both knees are 90 degrees.' },
      { name: 'Remo Inclinado', nameEn: 'Bent Over Rows', reps: '10 reps', instruction: 'Inclina el torso adelante, espalda recta, tira de las mancuernas hacia tu cintura.', instructionEn: 'Torso inclined forward, back straight, pull dumbbells to waist.' }
    ]
  },
  {
    id: 'arm_shred',
    title: 'Arm Shred', 
    focus: 'Upper Body',
    focusEn: 'Upper Body',
    level: 'I',
    sets: 3,
    restBetweenSets: '60 segundos',
    restBetweenSetsEn: '60 seconds',
    tags: ['tone', 'upper_body', 'female', 'male'],
    exercises: [
      { name: 'Curl de Bíceps', nameEn: 'Bicep Curls', reps: '12 reps', instruction: 'Mantén los codos pegados al torso. No balancees el cuerpo.', instructionEn: "Keep elbows glued to torso. Don't swing body." },
      { name: 'Extensión de Tríceps', nameEn: 'Tricep Extensions', reps: '10 reps', instruction: 'Mancuerna sobre la cabeza, baja el peso detrás de la nuca doblando los codos.', instructionEn: 'Dumbbell overhead, lower behind neck bending elbows.' },
      { name: 'Press de Hombros', nameEn: 'Shoulder Press', reps: '10 reps', instruction: 'Empuja verticalmente sin arquear la espalda baja.', instructionEn: 'Push vertically without arching lower back.' },
      { name: 'Remo al Mentón', nameEn: 'Upright Rows', reps: '12 reps', instruction: 'Sube las mancuernas pegadas al cuerpo hasta la altura del pecho, codos arriba.', instructionEn: 'Pull dumbbells up body line to chest height, elbows high.' }
    ]
  },
  {
    id: 'leg_day',
    title: 'Brute Leg Day',
    focus: 'Lower Body',
    focusEn: 'Lower Body',
    level: 'II',
    sets: 4,
    restBetweenSets: '20 segundos',
    restBetweenSetsEn: '20 seconds',
    tags: ['strength', 'lower_body', 'female'],
    exercises: [
      { name: 'Sentadillas', nameEn: 'Squats', reps: '10 reps', instruction: 'Pies al ancho de hombros, baja como si te sentaras en una silla invisible.', instructionEn: 'Feet shoulder width, lower as if sitting in invisible chair.' },
      { name: 'Zancadas', nameEn: 'Lunges', reps: '10 reps', instruction: 'Zancadas alternas. Mantén el torso erguido.', instructionEn: 'Alternating lunges. Keep torso upright.' },
      { name: 'Zancadas Laterales', nameEn: 'Side Lunges', reps: '10 reps', instruction: 'Da un paso lateral y baja la cadera sobre esa pierna, la otra estirada.', instructionEn: 'Step sideways, lower hip on that leg, keep other straight.' },
      { name: 'Elevación Talones', nameEn: 'Calf Raises', reps: '20 reps', instruction: 'Ponte de puntillas levantando los talones lo más alto posible.', instructionEn: 'Stand on toes lifting heels as high as possible.' },
      { name: 'Peso Muerto', nameEn: 'Deadlifts', reps: '10 reps', instruction: 'Piernas semirrígidas, baja las pesas rozando las piernas manteniendo espalda recta.', instructionEn: 'Semi-stiff legs, lower weights skimming legs keeping back straight.' }
    ]
  },
  {
    id: 'meta_burn',
    title: 'Meta Burn', 
    focus: 'Cardio',
    focusEn: 'Cardio',
    level: 'III',
    sets: 5,
    restBetweenSets: '20 segundos',
    restBetweenSetsEn: '20 seconds',
    tags: ['weight_loss', 'hiit', 'cardio'],
    exercises: [
      { name: 'Curl de Bíceps', nameEn: 'Bicep Curls', reps: '6 reps', instruction: 'Movimiento rápido y controlado.', instructionEn: 'Fast and controlled movement.' },
      { name: 'Elevaciones Laterales', nameEn: 'Lateral Raises', reps: '6 reps', instruction: 'Eleva los brazos a los lados hasta la altura de los hombros.', instructionEn: 'Raise arms to sides up to shoulder height.' },
      { name: 'Press de Hombros', nameEn: 'Shoulder Press', reps: '6 reps', instruction: 'Press militar rápido.', instructionEn: 'Fast military press.' },
      { name: 'Remo al Mentón', nameEn: 'Upright Rows', reps: '6 reps', instruction: 'Remo al mentón.', instructionEn: 'Row to chin.' },
      { name: 'Extensión Tríceps', nameEn: 'Tricep Extensions', reps: '6 reps', instruction: 'Extensión tras nuca.', instructionEn: 'Overhead extension.' }
    ]
  },
  {
    id: 'power_10',
    title: 'Power 10', 
    focus: 'Full Body',
    focusEn: 'Full Body',
    level: 'I',
    sets: 3,
    restBetweenSets: '60 segundos',
    restBetweenSetsEn: '60 seconds',
    tags: ['beginner', 'tone', 'quick'],
    exercises: [
      { name: 'Fondos Tríceps', nameEn: 'Tricep Dips', reps: '20 reps', instruction: 'Usa una silla o banco. Baja la cadera flexionando codos.', instructionEn: 'Use chair/bench. Lower hips bending elbows.' },
      { name: 'Curl de Bíceps', nameEn: 'Bicep Curls', reps: '20 reps', instruction: 'Curl de bíceps estándar con peso ligero/medio.', instructionEn: 'Standard curl with light/medium weight.' },
      { name: 'Puñetazos', nameEn: 'Punches', reps: '20 reps', instruction: 'Lanza puñetazos al aire controlando el movimiento con mancuernas ligeras.', instructionEn: 'Punch air controlling movement with light weights.' },
      { name: 'Elevaciones Brazos', nameEn: 'Arm Raises', reps: '20 reps', instruction: 'Elevaciones laterales para hombros.', instructionEn: 'Lateral raises for shoulders.' }
    ]
  },
  {
    id: 'abs_brute',
    title: 'Dumbbell Abs',
    focus: 'Abs',
    focusEn: 'Abs',
    level: 'II',
    sets: 4,
    restBetweenSets: '20 segundos',
    restBetweenSetsEn: '20 seconds',
    tags: ['core', 'abs', 'tone'],
    exercises: [
      { name: 'Abdominales Peso', nameEn: 'Sit-up Folds', reps: '10 reps', instruction: 'Abdominal clásico llevando el peso al pecho al subir.', instructionEn: 'Classic sit-up bringing weight to chest when up.' },
      { name: 'Giros Rusos', nameEn: 'Sitting Twists', reps: '10 reps', instruction: 'Sentado, gira el torso de lado a lado con el peso.', instructionEn: 'Russian twists. Seated, rotate torso side to side with weight.' },
      { name: 'Inclinación Lateral', nameEn: 'Side Tilts', reps: '10 reps', instruction: 'De pie, inclínate lateralmente deslizando la mancuerna por el muslo.', instructionEn: 'Standing, tilt sideways sliding dumbbell down thigh.' },
      { name: 'Corte Cruzado', nameEn: 'Cross Chops', reps: '10 reps', instruction: 'Lleva la mancuerna desde un hombro hacia la cadera contraria con fuerza.', instructionEn: 'Bring dumbbell from shoulder to opposite hip with force.' }
    ]
  }
];
