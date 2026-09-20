import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { Serialize } from '../common/decorators/serialize.decorator.js';
import { ApiMessage } from '../common/enums/api-message.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import { UserProfileDto } from '../users/dto/user-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @Serialize(UserProfileDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_FETCHED)
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  @Serialize(UserProfileDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_UPDATED)
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }

  @Delete()
  @Serialize(UserProfileDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_DELETED)
  deleteProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.deleteProfile(user.id);
  }

  @Patch('change-password')
  @ResponseMessage(ApiMessage.PASSWORD_CHANGED)
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(user.id, changePasswordDto);
  }
}
