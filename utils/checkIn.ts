export const symptomOptions = ['Cramps', 'Headache', 'Bloating', 'Fatigue'] as const;
export const moodOptions = ['Calm', 'Happy', 'Tired', 'Emotional', 'Anxious'] as const;
export function toggleSymptom(current: string, symptom: string): string {
  const values = current.split(',').map(value => value.trim()).filter(Boolean);
  return (values.some(value => value.toLowerCase() === symptom.toLowerCase()) ? values.filter(value => value.toLowerCase() !== symptom.toLowerCase()) : [...values, symptom]).join(', ');
}
export function hasSymptom(current: string, symptom: string) {
  return current.split(',').some(value => value.trim().toLowerCase() === symptom.toLowerCase());
}
