
export type Confidence = 'high' | 'medium' | 'low';
export type UnitSystem = 'metric' | 'imperial';
export type GoalType = 'fat_loss' | 'muscle_gain' | 'recomposition' | 'maintenance' | 'performance';
export type GoalStrategy = 'aggressive' | 'balanced' | 'conservative';

export type UIStyle = 
  | 'minimalism' 
  | 'bold_modern' 
  | 'vintage_retro' 
  | 'organic_natural' 
  | 'neon' 
  | 'pastel' 
  | 'cartoon';

export type JobType = 'sedentary' | 'mixed' | 'physical';
export type TrainingType = 'resistance' | 'cardio' | 'mixed' | 'none';
export type BodyFatEstimate = 'lean' | 'average' | 'high';
export type MuscleMassLevel = 'low' | 'medium' | 'high';
export type SleepQuality = 'poor' | 'average' | 'good';
export type StressLevel = 'low' | 'moderate' | 'high';
export type FatDistribution = 'central' | 'lower_body' | 'even';
export type HungerSensitivity = 'low' | 'normal' | 'high';
export type DietHistory = 'yo_yo' | 'first_time' | 'consistent';
export type AdherenceDays = '3-4' | '5-6' | '7';

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  style: UIStyle;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface GeminiNutritionResponse extends Macros {
  name: string;
  calories: number;
  confidence: Confidence;
  details: string;
  isAmbiguous: boolean;
  clarifyingQuestion?: string;
  suggestions: string[];
}

export interface FoodEntry extends GeminiNutritionResponse {
  id: string;
  timestamp: string;
  mealType: string;
  portionMultiplier: number;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  caloriesBurned: number;
  duration: number; // minutes
  type: 'cardio' | 'strength' | 'other';
  timestamp: string;
}

export interface DaySummary {
  date: string;
  totalCalories: number;
  totalMacros: Macros;
  totalBurned?: number;
  isLocked: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  tier: string;
  cardLast4?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; 
  height: number;
  targetWeight: number;
  unitSystem: UnitSystem;
  region?: string;
  
  isPro: boolean;
  subscriptionTier: 'free' | 'monthly' | 'annual' | 'student';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'none' | 'trialing';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  scansRemainingToday: number;
  dailyScanLimit: number;
  lifetimeLogs: number;

  goalType: GoalType;
  secondaryGoals?: string[];
  strategy: GoalStrategy;
  
  // Body Type
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph' | 'not_sure';
  frameStructure: string[];
  fatStoragePattern: 'belly' | 'hips_thighs' | 'arms' | 'overall';
  
  // Lifestyle
  jobType: JobType;
  dailySittingHours: number;
  workSchedule: 'morning' | 'evening' | 'rotating';
  
  // Exercise
  isCurrentlyWorkingOut: boolean;
  workoutLocation?: 'home' | 'gym' | 'both';
  trainingType: TrainingType;
  trainingFrequency: number; 
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredWorkoutLength: '15-20' | '30-40' | '45-60';
  
  // Health
  healthConditions: string[];
  customConditions?: string;
  hormonalConsiderations: boolean;
  restrictionHistory: boolean;
  stressLevel: StressLevel;
  sleepDuration: '<5' | '6-7' | '8+';
  energyLevels: 'low' | 'moderate' | 'high';
  
  // Diet
  dietaryPreference: 'vegetarian' | 'non_vegetarian' | 'vegan';
  allergies: string[];
  mealsPerDay: number;
  snackingHabits: 'rare' | 'moderate' | 'frequent';
  waterIntake: '<1L' | '1-2L' | '3L+';
  
  // Metabolism History
  dietHistory: DietHistory;
  gainSpeed: 'easily' | 'moderately' | 'difficulty';
  weightChangeLast6Months: number;
  
  // Aesthetics
  physiquePreference: 'lean_toned' | 'athletic' | 'curvy' | 'slim';
  avoidBulky: boolean;
  focusAreas: string[];
  
  // Expectations
  pacePreference: 'sustainable' | 'moderate' | 'aggressive';
  okWithLifestyleChanges: boolean;
  
  // Psychology
  primaryMotivation: string;
  biggestStruggle: string;
  adherenceProbability: AdherenceDays; 

  // Calculations
  dailyCalorieTarget: number;
  tdee: number;
  dailyMacroTargets: Macros;
  
  theme: ThemeConfig;
  startDate?: string;
  weightHistory: Array<{date: string, weight: number}>;
  exerciseHistory: ExerciseEntry[];
  invoices?: Invoice[];
}
