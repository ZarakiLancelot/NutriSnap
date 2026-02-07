
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NutritionAnalysis, UserProfile, Language, HistoryItem, ExerciseLog, DailyLog } from "../types";

const generateSystemInstruction = (profile?: UserProfile, language: Language = 'es') => {
  let context = "";
  let currencyLabel = "Dólares (USD)";

  const CURRENCY_MAP: Record<string, string> = {
      'GTQ': 'Quetzales (Q)',
      'USD': 'Dólares (USD)',
      'EUR': 'Euros (€)',
      'MXN': 'Pesos Mexicanos (MXN)',
      'COP': 'Pesos Colombianos (COP)',
      'ARS': 'Pesos Argentinos (ARS)',
      'CLP': 'Pesos Chilenos (CLP)',
      'PEN': 'Soles Peruanos (S/)',
      'UYU': 'Pesos Uruguayos (UYU)',
      'DOP': 'Pesos Dominicanos (DOP)'
  };

  if (profile) {
    const bmi = (profile.weightKg / ((profile.heightCm / 100) ** 2)).toFixed(1);
    const genderStr = language === 'en' 
        ? (profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : 'Other')
        : (profile.gender === 'male' ? 'Hombre' : profile.gender === 'female' ? 'Mujer' : 'Otro');
    
    if (profile.currency && CURRENCY_MAP[profile.currency]) {
        currencyLabel = CURRENCY_MAP[profile.currency];
    }

    context = `
    USER CONTEXT:
    - Profile: ${profile.age} years old, ${genderStr}.
    - Metrics: ${profile.heightCm}cm, ${profile.weightKg}kg.
    - BMI: ${bmi} (Use this to personalize caloric suggestions).
    `;
  }

  const langInstruction = language === 'en' 
    ? "IMPORTANT: RESPOND ONLY IN ENGLISH." 
    : "IMPORTANTE: RESPONDE SOLO EN ESPAÑOL.";

  return `You are NutriSnap, an expert nutrition and home economics assistant powered by Gemini 3.
  
  Your role is double:
  1. Analyze nutritional content of food.
  2. Estimate the FINANCIAL COST of that dish.

  ${context}
  ${langInstruction}

  FIRST STEP - QUALITY CHECK:
  - If image is not clear food: "es_valida": false.

  IF IMAGE IS VALID:
  1. IDENTIFICATION & NUTRITION:
     - Identify dish, calories, macros, and micros.

  2. FINANCIAL ANALYSIS:
     - Estimate cost to cook at home (ingredients per portion) in ${currencyLabel}.
     - Estimate cost to buy at a restaurant/fast food in ${currencyLabel}.
     - Calculate savings.
     - Generate a motivational message about savings (e.g., "You saved 50 ${currencyLabel.split('(')[1].replace(')', '')} cooking this!").

  3. CONTEXT:
     - Nutritional balance and recommendations.

  IMPORTANT:
  - Be conservative with prices.
  - Focus on "Home Cooking" vs "Eating Out".
  - Use the requested currency: ${currencyLabel}.`;
};

// Define the response schema strictly using the @google/genai types
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    es_valida: { type: Type.BOOLEAN },
    mensaje_error: { type: Type.STRING },
    alimento: { type: Type.STRING },
    peso_estimado_g: { type: Type.NUMBER },
    calorias: {
      type: Type.OBJECT,
      properties: {
        total: { type: Type.NUMBER },
        rango: { type: Type.STRING },
      },
      required: ["total", "rango"],
    },
    macros: {
      type: Type.OBJECT,
      properties: {
        proteina_g: { type: Type.NUMBER },
        carbohidratos_g: { type: Type.NUMBER },
        grasas_g: { type: Type.NUMBER },
        fibra_g: { type: Type.NUMBER },
      },
      required: ["proteina_g", "carbohidratos_g", "grasas_g", "fibra_g"],
    },
    micros_principales: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nutriente: { type: Type.STRING },
          cantidad: { type: Type.STRING },
        },
        required: ["nutriente", "cantidad"],
      },
    },
    costo_analisis: {
      type: Type.OBJECT,
      properties: {
        costo_casero_estimado: { type: Type.NUMBER, description: "Costo estimado de ingredientes para hacerlo en casa" },
        costo_restaurante_estimado: { type: Type.NUMBER, description: "Precio estimado en restaurante/delivery" },
        moneda: { type: Type.STRING, description: "Símbolo de moneda, ej: Q, $, €" },
        ahorro: { type: Type.NUMBER, description: "Diferencia (Restaurante - Casero)" },
        mensaje_ahorro: { type: Type.STRING, description: "Frase motivacional corta sobre el ahorro" }
      },
      required: ["costo_casero_estimado", "costo_restaurante_estimado", "moneda", "ahorro", "mensaje_ahorro"]
    },
    balanceado: { type: Type.BOOLEAN },
    analisis: { type: Type.STRING },
    recomendaciones: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "es_valida",
    "mensaje_error",
    "alimento",
    "peso_estimado_g",
    "calorias",
    "macros",
    "micros_principales",
    "costo_analisis",
    "balanceado",
    "analisis",
    "recomendaciones",
  ],
};

const reportSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        financial: {
            type: Type.OBJECT,
            properties: {
                totalSpentRestaurant: { type: Type.NUMBER },
                totalCostHome: { type: Type.NUMBER },
                potentialSavings: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                insight: { type: Type.STRING }
            },
            required: ["totalSpentRestaurant", "totalCostHome", "potentialSavings", "currency", "insight"]
        },
        emotional: {
            type: Type.OBJECT,
            properties: {
                mainMood: { type: Type.STRING },
                insight: { type: Type.STRING }
            },
            required: ["mainMood", "insight"]
        },
        health: {
            type: Type.OBJECT,
            properties: {
                avgDailyCalories: { type: Type.NUMBER },
                insight: { type: Type.STRING }
            },
            required: ["avgDailyCalories", "insight"]
        },
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    icon: { type: Type.STRING, description: "One of: wallet, heart, flame, brain" }
                }
            }
        }
    },
    required: ["financial", "emotional", "health", "suggestions"]
};

export const analyzeFoodImage = async (base64Image: string, mimeType: string, userProfile?: UserProfile, language: Language = 'es'): Promise<NutritionAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this food. Respond in ${language === 'en' ? 'English' : 'Spanish'}. Follow JSON schema.`,
          },
        ],
      },
      config: {
        systemInstruction: generateSystemInstruction(userProfile, language),
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
        return JSON.parse(response.text) as NutritionAnalysis;
    }
    throw new Error("No response text received from Gemini.");
    
  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};

const getLocalDateStringFromTimestamp = (timestamp: number) => {
    const now = new Date(timestamp);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const generateWeeklyInsights = async (
    foodHistory: HistoryItem[], 
    exerciseHistory: ExerciseLog[], 
    moodHistory: DailyLog[], 
    waterLog: { date: string, count: number }[],
    language: Language = 'es'
): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Filter last 15 days (Fortnightly view)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    let dataSummary = "";
    const dateMap = new Set<string>();
    
    const allHistory = [
        ...foodHistory.map(f => ({date: getLocalDateStringFromTimestamp(f.timestamp)})), 
        ...exerciseHistory.map(e => ({date: e.dateString})), 
        ...moodHistory.map(m => ({date: m.date}))
    ];
    allHistory.forEach(h => dateMap.add(h.date));

    const sortedDates = Array.from(dateMap).sort().reverse().slice(0, 15); 

    let totalRestaurantSpent = 0;
    let totalHomeCost = 0;
    let currencySymbol = "$";

    for (const dateStr of sortedDates) {
        const dayFood = foodHistory.filter(h => getLocalDateStringFromTimestamp(h.timestamp) === dateStr);
        const dayExercise = exerciseHistory.filter(e => e.dateString === dateStr);
        const dayMood = moodHistory.find(m => m.date === dateStr);
        
        if (dayFood.length > 0 || dayExercise.length > 0 || dayMood) {
            const foodDetails = dayFood.map(f => {
                const source = f.source || 'homemade';
                let cost = 0;
                if (source === 'restaurant') {
                    cost = f.realCost || f.costo_analisis?.costo_restaurante_estimado || 0;
                    totalRestaurantSpent += cost;
                } else {
                    cost = f.costo_analisis?.costo_casero_estimado || 0;
                    totalHomeCost += cost;
                }
                if (f.costo_analisis?.moneda) currencySymbol = f.costo_analisis.moneda;

                return `${f.alimento} (${f.calorias.total}kcal, Mood:${f.eatingMood || '?'}, Src:${source}, Cost:${cost})`;
            }).join('; ');

            const exerciseMins = dayExercise.reduce((sum, item) => sum + item.amount, 0);
            const overallMood = dayMood ? dayMood.mood : 'Unknown';
            
            dataSummary += `[Date: ${dateStr}] Mood: ${overallMood} | Ex: ${exerciseMins}m | Foods: ${foodDetails}\n`;
        }
    }

    const financialSummary = `
    FINANCIAL SUMMARY (Last 15 days):
    - Total Spent on Restaurant/Delivery: ${currencySymbol}${totalRestaurantSpent.toFixed(2)}
    - Total Estimated Home Cooking Cost: ${currencySymbol}${totalHomeCost.toFixed(2)}
    `;

    const prompt = `
    Analyze this user's data (last 15 days). 
    
    DATA:
    ${dataSummary}
    ${financialSummary}

    INSTRUCTIONS:
    Provide a JSON response with 4 sections:
    1. Financial: Spending analysis (Home vs Restaurant).
    2. Emotional: Pattern recognition.
    3. Health: Caloric and nutritional insights.
    4. Suggestions: 2 actionable tips.

    Language: ${language === 'en' ? 'English' : 'Spanish'}.
    Currency used: ${currencySymbol}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: reportSchema
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    } catch (e) {
        console.error("Error generating insights", e);
        return null;
    }
};
