import catalog from '@/data/verses.json';
import topicData from '@/data/guidance.json';
import { dateKey, daysBetween, parseDate } from './cycle';

export type Verse = { id: string; reference: string; text: string; translation: string };
export type GuidanceCard = { verse: Verse; explanation: string; goal: string };
export type ChristianDay = { name: string; verseId: string };
export const verses: Record<string, Verse> = catalog;
export const guidanceTopics = topicData;
export function topicCards(id: string): GuidanceCard[] {
  const topic = guidanceTopics.find(item => item.id === id) ?? guidanceTopics[0];
  return topic.cards.map(card => ({ verse: verses[card.verseId], explanation: card.explanation, goal: card.goal }));
}
// Preview-only placeholders. Replace with a chosen church calendar before release.
export function christianDays(year: number): Record<string, ChristianDay> {
  const key = (month: number, day: number) => dateKey(new Date(year, month - 1, day, 12));
  return {
    [key(12, 25)]: { name: 'Christmas · The birth of Jesus', verseId: 'luke-2-11' },
    [key(3, 29)]: { name: 'Palm Sunday · Preview date', verseId: 'john-12-13' },
    [key(4, 2)]: { name: 'The Last Supper · Preview date', verseId: 'john-13-34' },
    [key(4, 3)]: { name: 'Good Friday · Preview date', verseId: 'john-3-16' },
    [key(4, 5)]: { name: 'Easter · Preview date', verseId: 'john-11-25' },
    [key(5, 14)]: { name: 'Ascension · Preview date', verseId: 'acts-1-8' },
    [key(5, 24)]: { name: 'Pentecost · Preview date', verseId: 'acts-1-8' },
  };
}
export function holidayFor(day: string): ChristianDay | undefined {
  return christianDays(parseDate(day).getFullYear())[day];
}
export function dailyVerse(day: string): Verse {
  const holiday = holidayFor(day);
  if (holiday) return verses[holiday.verseId];
  const ids = Object.keys(verses);
  const index = ((daysBetween('2026-01-01', day) % ids.length) + ids.length) % ids.length;
  return verses[ids[index]];
}
export function parseGuidanceResponse(value: unknown): GuidanceCard[] {
  if (!value || typeof value !== 'object' || !('cards' in value) || !Array.isArray(value.cards) || value.cards.length !== 5) throw new Error('Invalid guidance');
  const ids = new Set<string>();
  return value.cards.map(card => {
    if (!card || typeof card.verseId !== 'string' || !Object.prototype.hasOwnProperty.call(verses, card.verseId) || ids.has(card.verseId) || typeof card.explanation !== 'string' || typeof card.goal !== 'string' || !card.explanation.trim() || !card.goal.trim()) throw new Error('Invalid guidance');
    ids.add(card.verseId);
    return { verse: verses[card.verseId], explanation: card.explanation, goal: card.goal };
  });
}
