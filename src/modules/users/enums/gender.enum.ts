export const Gender = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];
