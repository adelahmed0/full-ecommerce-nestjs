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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user.enum';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Serialize } from '../common/decorators/serialize.decorator';
import { ApiMessage } from '../common/enums/api-message.enum';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORY_CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORIES_FETCHED)
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORY_FETCHED)
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
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
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(CategoryResponseDto)
  @ResponseMessage(ApiMessage.CATEGORY_DELETED)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
