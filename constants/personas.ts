export type PersonaId = "default" | "aisha";

export const PERSONA_STORAGE_KEY = "herbie-persona";

export interface PersonaConfig {
  id: PersonaId;
  label: string;
  shortLabel: string;
  tagline: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  suggestions: string[];
}

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  default: {
    id: "default",
    label: "Herbie",
    shortLabel: "Herbie",
    tagline: "General natural remedy companion",
    welcomeTitle: "Herbie",
    welcomeSubtitle:
      "I'm your AI natural remedy companion. Ask me anything about remedies, recommendations, or support.",
    suggestions: [
      "Am I eligible for medical cannabis?",
      "Recommend herbs for a headache",
      "What is Myrcene and what does it do?",
      "What are the benefits of ginger?",
      "Natural ways to boost my immune system",
      "Remedies for an upset stomach",
    ],
  },
  aisha: {
    id: "aisha",
    label: "Aisha — Wellness Explorer",
    shortLabel: "Aisha",
    tagline: "Your calm, credible guide through wellness noise",
    welcomeTitle: "Herbie for Aisha",
    welcomeSubtitle:
      "Thoughtful, evidence-led wellness for women who want clarity — not hype. Explore herbs, cycle-aware support, sleep, stress, and more at your own pace.",
    suggestions: [
      "How do I tell evidence from wellness trends?",
      "What helps with PMS mood swings naturally?",
      "Is ashwagandha safe across my menstrual cycle?",
      "What magnesium may support sleep and cramps?",
      "How can I manage luteal-phase fatigue gently?",
      "What should I know about CBD and hormones?",
    ],
  },
};

export const DEFAULT_PERSONA: PersonaId = "default";

export function normalizePersona(value: unknown): PersonaId {
  if (value === "aisha") return "aisha";
  return DEFAULT_PERSONA;
}

export function getPersonaConfig(persona: PersonaId): PersonaConfig {
  return PERSONAS[persona];
}

export function getSuggestionsForPersona(persona: PersonaId): string[] {
  return PERSONAS[persona].suggestions;
}
