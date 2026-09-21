import { UserGender, UserRole } from '../users/enums/user.enum.js';

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

export const seedCategories = [
  {
    name: 'Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
  },
  {
    name: 'Fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
  },
  {
    name: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1484101403633-562f65cfb551?w=400',
  },
  {
    name: 'Sports',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=400',
  },
  {
    name: 'Books',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
  },
];
