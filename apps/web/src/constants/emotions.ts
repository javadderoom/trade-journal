export type EmotionValue = 'CONFIDENT' | 'NEUTRAL' | 'ANXIOUS' | 'FOMO' | 'REVENGE' | 'UNKNOWN';

export interface EmotionDef {
  value: EmotionValue;
  label: string;
  emoji: string;
}

const EMOTION_MAP: Record<EmotionValue, { en: string; fa: string; emoji: string }> = {
  CONFIDENT: { en: 'Confident', fa: 'با اطمینان', emoji: '😌' },
  NEUTRAL:   { en: 'Neutral',   fa: 'خنثی',      emoji: '😐' },
  ANXIOUS:   { en: 'Anxious',   fa: 'مضطرب',     emoji: '😰' },
  FOMO:      { en: 'FOMO',      fa: 'فومو (عجول)', emoji: '🎯' },
  REVENGE:   { en: 'Revenge',   fa: 'انتقامی',    emoji: '😡' },
  UNKNOWN:   { en: 'Unknown',   fa: 'نامشخص',     emoji: '💭' },
};

export const getEmotionLabel = (value: EmotionValue, locale: string): string => {
  const entry = EMOTION_MAP[value];
  if (!entry) return value;
  return locale === 'en' ? entry.en : entry.fa;
};

export const getEmotionEmoji = (value: string): string => {
  const entry = EMOTION_MAP[value as EmotionValue];
  return entry ? entry.emoji : '💭';
};

export const getDefaultEmotions = (locale: string): EmotionDef[] => {
  const isEn = locale === 'en';
  return Object.entries(EMOTION_MAP).map(([value, def]) => ({
    value: value as EmotionValue,
    label: isEn ? def.en : def.fa,
    emoji: def.emoji,
  }));
};
