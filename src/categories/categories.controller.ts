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
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/user.enum.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { Serialize } from '../common/decorators/serialize.decorator.js';
import { ApiMessage } from '../common/enums/api-message.enum.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORY_CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORIES_FETCHED)
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORY_FETCHED)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORY_UPDATED)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORY_DELETED)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
