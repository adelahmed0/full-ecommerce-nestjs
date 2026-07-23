export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export const UserActive = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

export const UserGender = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export type UserGender = (typeof UserGender)[keyof typeof UserGender];
export type UserActive = (typeof UserActive)[keyof typeof UserActive];
