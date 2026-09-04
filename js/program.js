// All the program's content and the logic that tailors it to a person.
import { addDays, TODAY } from './lib/dates.js';

export const PHASES = [
  { n: 1, name: 'Foundation', span: 'Months 1–3', job: 'Habit, movement quality, strength base, fat loss. No explosive work yet.' },
  { n: 2, name: 'Build', span: 'Months 4–6', job: 'Push strength harder, fuller range, add interval conditioning.' },
  { n: 3, name: 'Transition', span: 'Months 7–8', job: 'Leaner and stronger — now earn explosive work, done fresh.' },
  { n: 4, name: 'Performance', span: 'Months 9–10', job: 'Put it together: power, speed, conditioning, strength held.' },
];

export const phaseForMonth = (m) => m <= 3 ? PHASES[0] : m <= 6 ? PHASES[1] : m <= 8 ? PHASES[2] : PHASES[3];

export const MOBILITY = [
  'Wall ankle stretch — 30s ×2/side',
  'Deep supported squat hold — 30–60s ×2',
  'Half-kneeling hip flexor — 30s ×2/side',
  'Hamstring stretch — 30s ×2/side',
  'Glute figure-4 — 30s ×2/side',
  '90/90 hip stretch — 30s/side',
  'Cat-cow — 8–10 reps',
  'Seated spinal twist — 20s/side',
];

export const SUPPS = [
  { id: 'creatine', label: 'Creatine', note: '3–5g' },
  { id: 'vitd', label: 'Vitamin D', note: '1–2k IU' },
  { id: 'whey', label: 'Whey', note: 'as needed' },
];

export const TEMPLATES = {
  legsA: { label: 'Legs A', ex: ['Leg press', 'Goblet / box squat', 'Leg extension', 'Calf raise'] },
  legsB: { label: 'Legs B', ex: ['Hip thrust', 'Leg curl', 'Split squat', 'Leg press (feet high)', 'Calf raise'] },
  push: { label: 'Upper — Push', ex: ['Chest press', 'Shoulder press', 'Triceps pushdown', 'Plank'] },
  pull: { label: 'Upper — Pull', ex: ['Lat pulldown', 'Seated row', 'Biceps curl', 'Face pull'] },
  power: { label: 'Power (Phase 3+)', ex: ['Box jumps (step down)', 'Broad jumps', 'Med-ball throws'] },
};

const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };

// Builds a calorie/protein/phase plan from a person's stats. Includes guardrails:
// under-18 or already-lean profiles are held at maintenance rather than pushed
// into a deficit, and there is a hard calorie floor.
export function generateProgram(p) {
  const { weight: kg, height: cm, age, sex, activity } = p;
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * age + (sex === 'female' ? -161 : 5));
  const tdee = Math.round(bmr * (ACTIVITY[activity] || 1.55));
  const bmi = kg / Math.pow(cm / 100, 2);
  const floor = sex === 'female' ? 1400 : 1600;

  let cut, mode, note = '';
  if (age < 18) {
    cut = tdee; mode = 'maintain';
    note = 'Under 18 — this plan holds you at maintenance and skips a deficit. Please run any weight-loss goal past a doctor or coach first.';
  } else if (bmi < 19) {
    cut = tdee; mode = 'maintain';
    note = 'Your numbers are already lean — no deficit set. Focus on strength, mobility and eating around maintenance to build athletic muscle.';
  } else {
    cut = Math.max(floor, Math.round((tdee - 500) / 10) * 10); mode = 'cut';
  }

  const maintenance = Math.round(tdee / 10) * 10;
  const protein = Math.min(240, Math.max(90, Math.round((1.8 * kg) / 5) * 5));
  const start = p.startDate || TODAY;
  const offsets = [0, 90, 180, 240];
  const ends = [90, 180, 240, 300];
  const phases = PHASES.map((ph, i) => ({ ...ph, from: addDays(start, offsets[i]), to: addDays(start, ends[i]) }));

  // Daily macro targets built around the primary calorie number.
  // Protein is the anchor; fat ~25% of calories (a sensible floor); carbs fill the rest.
  const dayTarget = cut;
  const fat = Math.round((0.25 * dayTarget) / 9);
  const carbs = Math.max(0, Math.round((dayTarget - protein * 4 - fat * 9) / 4));
  const macros = { kcal: dayTarget, protein, fat, carbs };

  return {
    bmr, tdee, cut, maintenance, surplus: maintenance + 180, protein, macros, mode, note,
    bmi: Math.round(bmi * 10) / 10, start, steps: '8,000–10,000',
    weeklyTarget: mode === 'cut' ? '0.4–0.6 kg down' : 'hold steady',
    phases, generatedAt: TODAY,
  };
}
