import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ApiMessage } from '../common/enums/api-message.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.userModel.findOne({ email: createUserDto.email });
    if (user) {
      throw new ConflictException({
        message: ApiMessage.USER_ALREADY_EXISTS,
        errors: { email: 'Email is already taken' },
      });
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(ApiMessage.USER_NOT_FOUND);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.email) {
      const emailTaken = await this.userModel.exists({
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      if (emailTaken) {
        throw new ConflictException({
          message: ApiMessage.USER_ALREADY_EXISTS,
          errors: { email: 'Email is already taken' },
        });
      }
    }

    const payload = { ...updateUserDto };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(ApiMessage.USER_NOT_FOUND);
    }

    return user;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
