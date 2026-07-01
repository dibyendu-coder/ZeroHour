/**
 * Shared Type Definitions for ZeroHour
 */

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string or simple datetime string
  difficulty: 'easy' | 'medium' | 'hard';
  panicLevel: number; // 1 to 10
  category: string; // Custom or default category ID
  completed: boolean;
  notes?: string;
  survivalPlanGenerated?: boolean;
  createdAt?: string;
  completedAt?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  color: string; // Tailwind class combo for bg, border, and text
  icon: string; // Emoji
}

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'academic', name: 'Academic', color: 'bg-indigo-50 border-indigo-200 text-indigo-750', icon: '🎓' },
  { id: 'professional', name: 'Professional', color: 'bg-emerald-50 border-emerald-200 text-emerald-750', icon: '💼' },
  { id: 'personal', name: 'Personal', color: 'bg-amber-50 border-amber-200 text-amber-750', icon: '🏠' },
  { id: 'household', name: 'Household', color: 'bg-rose-50 border-rose-200 text-rose-750', icon: '⚡' },
  { id: 'other', name: 'Other', color: 'bg-slate-50 border-slate-200 text-slate-750', icon: '📦' },
];

export interface SurvivalStep {
  id: string;
  title: string;
  durationMinutes: number;
  description: string;
  completed: boolean;
}

export interface SurvivalPlan {
  taskId: string;
  steps: SurvivalStep[];
  timeBudgetSummary: string;
  draftTitle: string;
  draftContent: string; // Code, essay outline, study notes, or meeting prep
  proTip: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompleted?: string; // Date string
}

export interface TriageCategory {
  title: string;
  taskIds: string[];
  description: string;
  urgencyColor: string;
}

export interface TriageResult {
  categories: {
    emergency: TriageCategory; // Do Now
    quickWins: TriageCategory;  // Rapid tasks
    schedule: TriageCategory;   // Plannable tasks
    postpone: TriageCategory;   // Low urgency / delegate
  };
  globalAnalysis: string;
  topActionItems: string[];
}

export interface ProcrastinationRisk {
  riskScore: number; // 0 to 100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  analysis: string;
  mitigationSteps: string[];
}

export interface ExcuseDraft {
  subject: string;
  body: string;
  tips: string;
}

export interface PepTalk {
  text: string;
  audioBase64?: string; // Base64 PCM or MP3 depending on TTS
}
