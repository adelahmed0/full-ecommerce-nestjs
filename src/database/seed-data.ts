import { UserGender, UserRole } from '../users/enums/user.enum';

export const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: '123456',
    role: UserRole.ADMIN,
    phoneNumber: '01012345678',
    address: 'Cairo, Egypt',
    gender: UserGender.MALE,
    age: 30,
  },
  {
    name: 'Test User',
    email: 'user@example.com',
    password: '123456',
    role: UserRole.USER,
    phoneNumber: '01123456789',
    address: 'Alexandria, Egypt',
    gender: UserGender.FEMALE,
    age: 25,
  },
];
