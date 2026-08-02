import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Serialize } from '../common/decorators/serialize.decorator';
import { ApiMessage } from '../common/enums/api-message.enum';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  @Serialize(UserResponseDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_FETCHED)
  getProfile(@CurrentUser('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @Serialize(UserResponseDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_UPDATED)
  updateProfile(
    @CurrentUser('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.update(id, updateProfileDto);
  }

  @Delete('profile')
  @UseGuards(AuthGuard)
  @Serialize(UserResponseDto)
  @ResponseMessage(ApiMessage.USER_PROFILE_DELETED)
  deleteProfile(@CurrentUser('id') id: string) {
    return this.usersService.remove(id);
  }
}
