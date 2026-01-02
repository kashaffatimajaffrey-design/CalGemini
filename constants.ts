
import { UserProfile, Macros } from './types';

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export const NUTRITION_SYSTEM_PROMPT = `
You are a world-class nutritional AI. Your task is to estimate calories AND macros (protein, carbs, fat in grams) for food.

RULES:
1. Return ONLY JSON.
2. Estimate based on standard portions unless specified.
3. INTEGRATED TOTALS: If a user provides "additions" (e.g., "plus a side of fries"), calculate the NEW TOTAL including these items as one entry.
4. CLARIFICATION LOOP: If the description is vague (e.g., "I had a sandwich" without ingredients, or "a piece of cake" without size), you MUST set 'isAmbiguous' to true and provide a sharp 'clarifyingQuestion'.
5. Do NOT guess if you are unsure of the volume. Ask a question first.
6. Provide suggestions for healthier swaps or common add-ons.
`;

export const KCAL_PER_KG = 7700;

/**
 * Calculates targets and returns them in the format expected by the UserProfile interface.
 */
export const calculateTargets = (profile: Partial<UserProfile>) => {
  const weight = profile.unitSystem === 'imperial' ? (profile.weight || 0) * 0.453592 : (profile.weight || 0);
  const height = profile.height || 0;

  // Mifflin-St Jeor BMR
  let bmr = (10 * weight) + (6.25 * height) - (5 * (profile.age || 0));
  bmr = profile.gender === 'male' ? bmr + 5 : bmr - 161;
  
  // TDEE Activity Multiplier Logic
  let multiplier = 1.2; 
  if (profile.jobType === 'mixed') multiplier += 0.1;
  if (profile.jobType === 'physical') multiplier += 0.25;
  
  // Adjust multiplier for daily sitting hours
  if ((profile.dailySittingHours || 0) > 8) multiplier -= 0.05;
  
  const trainingIntensity = profile.trainingType === 'resistance' ? 0.07 : 
                            profile.trainingType === 'cardio' ? 0.05 : 
                            profile.trainingType === 'mixed' ? 0.08 : 0;
  
  multiplier += (profile.trainingFrequency || 0) * trainingIntensity;

  let tdee = bmr * multiplier;
  
  // Body Type Adjustments
  if (profile.bodyType === 'endomorph') tdee *= 0.95;
  if (profile.bodyType === 'ectomorph') tdee *= 1.05;

  // Metabolic adjustments for specific conditions
  if (profile.healthConditions?.includes('Thyroid') || profile.healthConditions?.includes('PCOS')) tdee *= 0.92; 
  if (profile.dietHistory === 'yo_yo') tdee *= 0.96; 
  
  // Sleep Adjustment
  if (profile.sleepDuration === '<5') tdee *= 0.95;

  // Strategy-based adjustments
  let calorieAdjustment = 0;
  let pRatio = 0.30; 
  let fRatio = 0.25;

  const strategy = profile.pacePreference || 'moderate';

  switch (profile.goalType) {
    case 'fat_loss':
      if (strategy === 'aggressive') calorieAdjustment = -800;
      else if (strategy === 'moderate') calorieAdjustment = -500;
      else calorieAdjustment = -300;
      pRatio = 0.35; 
      break;
    case 'muscle_gain':
      if (strategy === 'aggressive') calorieAdjustment = 400;
      else if (strategy === 'moderate') calorieAdjustment = 250;
      else calorieAdjustment = 150;
      pRatio = 0.28; 
      break;
    case 'recomposition':
      calorieAdjustment = -100;
      pRatio = 0.40; 
      break;
    case 'maintenance':
      calorieAdjustment = 0;
      pRatio = 0.25;
      break;
  }

  // PCOS / Insulin Resistance logic
  if (profile.healthConditions?.includes('PCOS') || profile.healthConditions?.includes('Insulin Resistance')) {
    pRatio = Math.max(pRatio, 0.35); 
    fRatio = Math.max(fRatio, 0.35); 
  }

  let finalCalories = Math.round(tdee + calorieAdjustment);
  const floor = profile.gender === 'male' ? 1500 : 1200;
  finalCalories = Math.max(finalCalories, floor);

  const carbsRatio = 1 - (pRatio + fRatio);

  return {
    tdee: Math.round(tdee),
    dailyCalorieTarget: finalCalories, // Renamed from 'calories'
    dailyMacroTargets: {               // Renamed from 'macros'
      protein: Math.round((finalCalories * pRatio) / 4),
      carbs: Math.round((finalCalories * carbsRatio) / 4),
      fat: Math.round((finalCalories * fRatio) / 9)
    }
  };
};

export const getTimelineScenarios = (profile: UserProfile) => {
  if (!profile || profile.goalType === 'maintenance') return null;
  
  const calorieDiff = profile.dailyCalorieTarget - profile.tdee;
  
  // If user has no deficit/surplus, we can't calculate time
  if (Math.abs(calorieDiff) < 10) return { warning: "Metabolic parity detected. Adjust targets to see arrival prediction." };
  
  const weightDiff = Math.abs(profile.weight - profile.targetWeight);
  const totalKcalRequired = weightDiff * KCAL_PER_KG;
  
  let adherenceMultiplier = 1.0;
  if (profile.adherenceProbability === '3-4') adherenceMultiplier = 0.55;
  else if (profile.adherenceProbability === '5-6') adherenceMultiplier = 0.85;

  const effectiveDailyChange = Math.abs(calorieDiff) * adherenceMultiplier;
  const daysRequired = totalKcalRequired / Math.max(1, effectiveDailyChange);
  
  // REALISM JUDGMENT (Metabolic Resistance)
  let resistanceMultiplier = 1.0;
  let analysisFactors = [];

  if (profile.healthConditions?.includes('Thyroid')) {
    resistanceMultiplier += 0.20;
    analysisFactors.push("Thyroid modulation");
  }
  if (profile.healthConditions?.includes('PCOS') || profile.healthConditions?.includes('Insulin Resistance')) {
    resistanceMultiplier += 0.15;
    analysisFactors.push("Insulin sensitivity");
  }
  if (profile.bodyType === 'endomorph') {
    resistanceMultiplier += 0.1;
    analysisFactors.push("Endomorph adaptation");
  }
  if (profile.sleepDuration === '<5') {
    resistanceMultiplier += 0.15;
    analysisFactors.push("Cortisol elevation");
  }

  const realisticWeeks = Math.ceil((daysRequired * resistanceMultiplier) / 7);

  let analysis = "Standard metabolic flow.";
  if (analysisFactors.length > 0) {
    analysis = `Metabolic resistance detected: ${analysisFactors.join(', ')}. Prediction adjusted for biological variance.`;
  } else {
    analysis = `Biological path is clear. Arrival estimated in approx. ${realisticWeeks} weeks based on current strategy.`;
  }

  return {
    best: Math.ceil(daysRequired / 7),
    realistic: realisticWeeks,
    analysis: analysis,
    warning: Math.abs(calorieDiff) > 1000 ? "Clinical Alert: Calorie delta exceeds metabolic safety threshold." : null
  };
};
