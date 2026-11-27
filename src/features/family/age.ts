/** "5 tuổi" from a birth year (data minimisation: year only). Pure. */
export function ageLabel(birthYear: number | null, now = new Date()): string {
  if (!birthYear) return "";
  const age = now.getUTCFullYear() - birthYear;
  return age > 0 ? `${age} tuổi` : "";
}
