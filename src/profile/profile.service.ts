import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ApiMessage } from '../common/enums/api-message.enum';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly usersService: UsersService) {}

  getProfile(id: string) {
    return this.usersService.findOne(id);
  }

  updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    return this.usersService.update(id, updateProfileDto);
  }

  deleteProfile(id: string) {
    return this.usersService.remove(id);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    if (currentPassword === newPassword) {
      throw new BadRequestException(ApiMessage.PASSWORD_SAME_AS_CURRENT);
    }

    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException(ApiMessage.USER_NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException({
        message: ApiMessage.CURRENT_PASSWORD_INCORRECT,
        errors: { currentPassword: ApiMessage.CURRENT_PASSWORD_INCORRECT },
      });
    }

    await this.usersService.update(userId, { password: newPassword });

    return null;
  }
}
