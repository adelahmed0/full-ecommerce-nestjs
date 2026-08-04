import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiMessage } from '../common/enums/api-message.enum';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user.enum';
import { UserDocument } from '../users/schemas/user.schema';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const RESET_CODE_COOLDOWN_MS = 60 * 1000;
const RESET_CODE_EXPIRES_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmailForPasswordReset(
      forgotPasswordDto.email,
    );

    if (!user || !user.active) {
      throw new NotFoundException(ApiMessage.EMAIL_NOT_FOUND);
    }

    if (user.verificationCodeSentAt) {
      const elapsed =
        Date.now() - new Date(user.verificationCodeSentAt).getTime();

      if (elapsed < RESET_CODE_COOLDOWN_MS) {
        const waitSeconds = Math.ceil(
          (RESET_CODE_COOLDOWN_MS - elapsed) / 1000,
        );

        throw new HttpException(
          `Please wait ${waitSeconds} seconds before requesting another code`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRES_MS);

    await this.usersService.setVerificationCode(
      String(user.id),
      code,
      expiresAt,
    );

    // Send email in the background so the API responds quickly.
    void this.mailService
      .sendPasswordResetCode(user.email, code, user.name)
      .catch((error: unknown) => {
        this.logger.error(
          `Background password reset email failed for ${user.email}`,
          error instanceof Error ? error.stack : error,
        );
      });

    return null;
  }

  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto) {
    await this.assertValidResetCode(
      verifyResetCodeDto.email,
      verifyResetCodeDto.code,
    );

    return null;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.assertValidResetCode(
      resetPasswordDto.email,
      resetPasswordDto.code,
    );

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.usersService.resetPasswordWithCode(
      String(user.id),
      hashedPassword,
    );

    return null;
  }

  private async assertValidResetCode(email: string, code: string) {
    const user = await this.usersService.findByEmailForPasswordReset(email);

    if (!user || !user.active) {
      throw new NotFoundException(ApiMessage.EMAIL_NOT_FOUND);
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      throw new BadRequestException(ApiMessage.INVALID_RESET_CODE);
    }

    if (new Date(user.verificationCodeExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException(ApiMessage.RESET_CODE_EXPIRED);
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException(ApiMessage.INVALID_RESET_CODE);
    }

    return user;
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
