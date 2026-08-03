import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user.enum';
import { UserDocument } from '../users/schemas/user.schema';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const user = await this.usersService.create({
      ...signUpDto,
      role: UserRole.USER,
    });

    return this.buildAuthResponse(user);
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findByEmailWithPassword(
      signInDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    return this.buildAuthResponse(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException({
        message: 'Current password is incorrect',
        errors: { currentPassword: 'Current password is incorrect' },
      });
    }

    await this.usersService.update(userId, { password: newPassword });

    return null;
  }

  getProfile(id: string) {
    return this.usersService.findOne(id);
  }

  updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    return this.usersService.update(id, updateProfileDto);
  }

  deleteProfile(id: string) {
    return this.usersService.remove(id);
  }

  private async buildAuthResponse(user: UserDocument) {
    const payload: JwtPayload = {
      id: String(user.id),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user: user.toObject(),
      accessToken,
    };
  }
}
