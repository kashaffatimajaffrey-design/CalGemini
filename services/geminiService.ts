import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { GeminiNutritionResponse, UserProfile, FoodEntry, ThemeConfig, UIStyle, ExerciseEntry } from "../types";
import { NUTRITION_SYSTEM_PROMPT } from "../constants";

const NUTRITION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
    confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
    details: { type: Type.STRING },
    isAmbiguous: { type: Type.BOOLEAN },
    clarifyingQuestion: { type: Type.STRING },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["name", "calories", "protein", "carbs", "fat", "confidence", "details", "isAmbiguous"],
};

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const normalizeHex = (color: string) => color.startsWith('#') ? color : `#${color}`;

export const decodeAudio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const suggestTheme = async (favColor: string, style: UIStyle): Promise<ThemeConfig> => {
  const intensityMap: Record<UIStyle, string> = {
    minimalism: "Low intensity, muted colors, extreme whitespace.",
    bold_modern: "High saturation, high contrast, geometric.",
    vintage_retro: "Warm nostalgic tones, film-grain feel.",
    organic_natural: "Soft earthy tones, nature-inspired.",
    neon: "Ultra-high intensity neon glow, deep blacks.",
    pastel: "Very low intensity soft hues, airy.",
    cartoon: "Vivid playful intensity, bold outlines."
  };

  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Design a high-quality, professional UI color theme. Inspiration: "${favColor}". Style: "${style}". 
    Aura Intensity: ${intensityMap[style]}. 
    Ensure colors are distinct and accessible. 
    Return 4 hex codes: primary, secondary (action), accent (highlights), background (backdrop).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primary: { type: Type.STRING },
          secondary: { type: Type.STRING },
          accent: { type: Type.STRING },
          background: { type: Type.STRING },
        },
        required: ["primary", "secondary", "accent", "background"]
      }
    }
  });
  const colors = JSON.parse(response.text || '{}');
  return { 
    primary: normalizeHex(colors.primary), 
    secondary: normalizeHex(colors.secondary), 
    accent: normalizeHex(colors.accent), 
    background: normalizeHex(colors.background), 
    style 
  };
};

export const estimateNutritionFromText = async (text: string): Promise<GeminiNutritionResponse> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: `Estimate macros for: "${text}"`,
    config: {
      systemInstruction: NUTRITION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: NUTRITION_SCHEMA,
    },
  });
  return JSON.parse(response.text || '{}');
};

export const estimateNutritionFromImage = async (base64Image: string, mimeType: string): Promise<GeminiNutritionResponse> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      },
      {
        text: "Analyze this image. Estimate calories and macros. If it's a barcode, extract the data. Return JSON."
      }
    ],
    config: {
      systemInstruction: NUTRITION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: NUTRITION_SCHEMA,
    },
  });
  return JSON.parse(response.text || '{}');
};

export const refineNutrition = async (currentFood: string, refinement: string): Promise<GeminiNutritionResponse> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The user previously logged "${currentFood}". Now they say: "${refinement}". Update the total estimate.`,
    config: {
      systemInstruction: NUTRITION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: NUTRITION_SCHEMA,
    },
  });
  return JSON.parse(response.text || '{}');
};

export const estimateExercise = async (query: string, weight: number): Promise<Partial<ExerciseEntry>> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Estimate calories for ${weight}kg person: "${query}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          caloriesBurned: { type: Type.NUMBER },
          duration: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ['cardio', 'strength', 'other'] }
        },
        required: ["name", "caloriesBurned", "duration", "type"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateMealPlan = async (profile: UserProfile): Promise<string> => {
  const ai = getAIClient();
  
  const protein = profile.dailyMacroTargets?.protein || 150;
  const carbs = profile.dailyMacroTargets?.carbs || 200;
  const fat = profile.dailyMacroTargets?.fat || 70;

  const prompt = `YOU ARE A CLINICAL METABOLIC SPECIALIST. 
  Generate a bespoke 72-HOUR METABOLIC PROTOCOL for ${profile.name}.
  
  CORE BIO-MARKERS:
  - Objective: ${profile.goalType} (Strategy: ${profile.pacePreference})
  - Metrics: ${profile.weight}kg -> Target: ${profile.targetWeight}kg
  - Daily Budget: ${profile.dailyCalorieTarget} kcal
  - Target Macros: P ${protein}g, C ${carbs}g, F ${fat}g
  - Biological Variables: ${profile.healthConditions.join(', ') || 'Standard Baseline'}
  - Somatotype: ${profile.bodyType} | Activity: ${profile.trainingFrequency}x/week
  
  REQUIRED OUTPUT:
  1. A structured Day 1, Day 2, Day 3 plan.
  2. For EACH DAY, explain the 'BIOLOGICAL RATIONALE' for why these specific macros were chosen based on their ${profile.bodyType} body type.
  3. Include a 'Timeline Forecast' based on their adherence probability.
  4. Use professional clinical markdown. Avoid generic advice.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 8000 } }
    });
    return response.text || "Synthesis failed.";
  } catch (err) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "Synthesis failed.";
  }
};

export const speakText = async (text: string): Promise<string | undefined> => {
  const ai = getAIClient();
  // Thoroughly clean text to prevent 500 errors. 
  // Remove markdown symbols, special chars, and limit length.
  const cleanText = text
    .replace(/[#*_~`\[\]()>]/g, '')
    .replace(/[-+]{2,}/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 800); 

  if (!cleanText) return undefined;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Briefing: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) return undefined;
    
    const audioPart = parts.find(part => part.inlineData && part.inlineData.data);
    return audioPart?.inlineData?.data;
  } catch (err) {
    console.error("TTS API Internal Error:", err);
    return undefined;
  }
};

export const createCoachingChat = (profile: UserProfile, entries: FoodEntry[], totals: any, useThinking: boolean): Chat => {
  const instruction = `You are the CalGemini Metabolic OS.
  Client: ${profile.name} | Goal: ${profile.goalType} | Status: ${totals.calories}/${profile.dailyCalorieTarget} kcal.
  Somatotype: ${profile.bodyType}.
  Provide data-driven coaching with clinical precision. Use search for latest metabolic research.
  IMPORTANT: If the user explicitly asks you to "stop", "be quiet", or "shut up", confirm you are stopping, but your current audio stream will be cancelled by the UI. Keep your textual confirmation brief.`;
  const ai = getAIClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview', 
    config: { 
      systemInstruction: instruction,
      tools: [{ googleSearch: {} }],
      ...(useThinking ? { thinkingConfig: { thinkingBudget: 16000 } } : {})
    },
  });
};