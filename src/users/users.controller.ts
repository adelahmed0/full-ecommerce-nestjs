import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Serialize } from '../common/decorators/serialize.decorator';
import { ApiMessage } from '../common/enums/api-message.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user.enum';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(UserResponseDto)
  @ResponseMessage(ApiMessage.USER_CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ResponseMessage(ApiMessage.USERS_FETCHED)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ResponseMessage(ApiMessage.USER_FETCHED)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage(ApiMessage.USER_UPDATED)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ResponseMessage(ApiMessage.USER_DELETED)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
