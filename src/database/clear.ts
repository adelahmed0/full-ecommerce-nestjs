import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { User } from '../users/schemas/user.schema';

async function clear() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const result = await userModel.deleteMany({});

  console.log(`Deleted ${result.deletedCount} user(s)`);
  console.log('Clear completed');
  await app.close();
}

void clear();
