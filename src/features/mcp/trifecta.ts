import type { TrifectaLabel, TrifectaLeg, TrifectaLevel } from './api';

// The lethal trifecta of a tool (Backend 097, Admin 058): its legs, the names and colors of its levels,
// and the effective levels of a label. The review page and the Custom MCPs list share it.

// What each level means, from the level definitions of Backend 097 Implementation Decision 8.
export const legs: { key: TrifectaLeg; label: string; means: Record<TrifectaLevel, string> }[] = [
  { key: 'private_data', label: 'Reads private data', means: {
    none: 'Reads only public data, or reads nothing.',
    low: 'Reads private data only as metadata, or in a narrow scope that the call names.',
    high: 'Reads private records or content of people or of the business.' } },
  { key: 'untrusted_content', label: 'Brings untrusted content', means: {
    none: 'Returns only data the customer controls, or computed values.',
    low: 'Returns third-party text only in short, structured fields.',
    high: 'Returns free text that a third party can write.' } },
  { key: 'external_communication', label: 'Sends data out', means: {
    none: 'Sends nothing out of the server.',
    low: 'Writes only to a fixed destination of the customer, chosen by the server.',
    high: 'Sends data to a destination that the call chooses or that others can read.' } },
];
// The none level reads OK, because "None" read as an empty value (Admin 058).
export const levelName: Record<TrifectaLevel, string> = { none: 'OK', low: 'Low', high: 'High' };
// One meaning per color: OK green, Low yellow, High red.
export const levelTone: Record<TrifectaLevel, string> = { none: 'success', low: 'warning', high: 'danger' };

// Corrections of one tool in the review, by leg: a level, or null to remove a stored correction.
export type ToolCorrections = Partial<Record<TrifectaLeg, TrifectaLevel | null>>;

// effectiveLevels are the levels that the gateway uses: a correction wins over the model. A leg without
// a level stays undefined (a failed label that nobody completed).
export function effectiveLevels(label: TrifectaLabel | undefined, corrections: ToolCorrections = {}): Partial<Record<TrifectaLeg, TrifectaLevel>> {
  const out: Partial<Record<TrifectaLeg, TrifectaLevel>> = {};
  for (const { key } of legs) {
    const corrected = key in corrections ? corrections[key] : undefined;
    out[key] = corrected === null ? label?.model?.[key] : corrected ?? label?.operator?.[key] ?? label?.model?.[key];
  }
  return out;
}

// highLegs counts the High legs of a tool, for the review alert and the Custom MCPs list.
export function highLegs(label: TrifectaLabel | undefined): number {
  const levels = effectiveLevels(label);
  return legs.filter(l => levels[l.key] === 'high').length;
}

// labeled reports whether a label has a level for each leg (a failed label that nobody completed has not).
export function labeled(label: TrifectaLabel | undefined): boolean {
  const levels = effectiveLevels(label);
  return legs.every(l => levels[l.key]);
}
