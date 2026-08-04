import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ApiMessage } from '../common/enums/api-message.enum';
import { buildPaginatedResult } from '../common/dto/paginated-result';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
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

  async findAll(query: FindUsersQueryDto) {
    const {
      page,
      per_page,
      search,
      role,
      gender,
      active,
      phoneNumber,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (gender) filter.gender = gender;
    if (active !== undefined) filter.active = active === 'true';
    if (phoneNumber) filter.phoneNumber = phoneNumber;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * per_page)
        .limit(per_page)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult('users', users, total, page, per_page);
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(ApiMessage.USER_NOT_FOUND);
    }
    return user;
  }

  findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+password').exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  findByEmailForPasswordReset(email: string) {
    return this.userModel
      .findOne({ email })
      .select(
        '+verificationCode +verificationCodeExpiresAt +verificationCodeSentAt',
      )
      .exec();
  }

  async setVerificationCode(userId: string, code: string, expiresAt: Date) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          verificationCode: code,
          verificationCodeExpiresAt: expiresAt,
          verificationCodeSentAt: new Date(),
        },
        { returnDocument: 'after' },
      )
      .exec();
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
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
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
