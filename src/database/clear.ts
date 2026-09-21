import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module.js';
import { Category } from '../categories/schemas/category.schema.js';
import { User } from '../users/schemas/user.schema.js';

async function clear() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));

  const usersResult = await userModel.deleteMany({});
  const categoriesResult = await categoryModel.deleteMany({});

  console.log(`Deleted ${usersResult.deletedCount} user(s)`);
  console.log(`Deleted ${categoriesResult.deletedCount} categor(ies)`);
  console.log('Clear completed');
  await app.close();
}

void clear();
