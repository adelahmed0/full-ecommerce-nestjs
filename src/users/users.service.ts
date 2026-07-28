import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ApiMessage } from '../common/enums/api-message.enum';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../common/dto/paginated-result';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

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

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserDocument, 'users'>> {
    const page = query.page;
    const perPage = query.per_page;
    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(perPage).exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return buildPaginatedResult('users', items, total, page, perPage);
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

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(ApiMessage.USER_NOT_FOUND);
    }
    return user;
  }
}
