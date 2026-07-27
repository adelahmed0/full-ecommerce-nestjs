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
import { ApiMessage } from '../common/enums/api-message.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard)
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
