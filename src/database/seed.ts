import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AppModule } from '../app.module.js';
import { Category } from '../categories/schemas/category.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { seedCategories, seedUsers } from './seed-data.js';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));

  for (const user of seedUsers) {
    const exists = await userModel.exists({ email: user.email });

    if (exists) {
      console.log(`Skipped user (exists): ${user.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    await userModel.create({
      ...user,
      password: hashedPassword,
    });

    console.log(`Created user: ${user.email} (${user.role})`);
  }

  for (const category of seedCategories) {
    const exists = await categoryModel.exists({ name: category.name });

    if (exists) {
      console.log(`Skipped category (exists): ${category.name}`);
      continue;
    }

    await categoryModel.create(category);
    console.log(`Created category: ${category.name}`);
  }

  console.log('Seed completed');
  await app.close();
}

void seed();
