import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { User } from '../users/schemas/user.schema';
import { seedUsers } from './seed-data';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  for (const user of seedUsers) {
    const exists = await userModel.exists({ email: user.email });

    if (exists) {
      console.log(`Skipped (exists): ${user.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    await userModel.create({
      ...user,
      password: hashedPassword,
    });

    console.log(`Created: ${user.email} (${user.role})`);
  }

  console.log('Seed completed');
  await app.close();
}

void seed();
