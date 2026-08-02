import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Serialize } from '../common/decorators/serialize.decorator';
import { ApiMessage } from '../common/enums/api-message.enum';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Serialize(AuthResponseDto)
  @ResponseMessage(ApiMessage.SIGNED_UP)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @Serialize(UserResponseDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_FETCHED)
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.id);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @Serialize(UserResponseDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_UPDATED)
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Delete('profile')
  @UseGuards(AuthGuard)
  @Serialize(UserResponseDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_DELETED)
  deleteProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.deleteProfile(user.id);
  }
}
