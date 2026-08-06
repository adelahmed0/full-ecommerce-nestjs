import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Serialize } from '../common/decorators/serialize.decorator';
import { ApiMessage } from '../common/enums/api-message.enum';
import { UserRole } from '../users/enums/user.enum';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { FindSubCategoriesQueryDto } from './dto/find-sub-categories-query.dto';
import { SubCategoryResponseDto } from './dto/sub-category-response.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { SubCategoriesService } from './sub-categories.service';

@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(SubCategoryResponseDto)
  @ResponseMessage(ApiMessage.SUB_CATEGORY_CREATED)
  create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    return this.subCategoriesService.create(createSubCategoryDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN, UserRole.USER])
  @Serialize(SubCategoryResponseDto)
  @ResponseMessage(ApiMessage.SUB_CATEGORIES_FETCHED)
  findAll(@Query() query: FindSubCategoriesQueryDto) {
    return this.subCategoriesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN, UserRole.USER])
  @Serialize(SubCategoryResponseDto)
  @ResponseMessage(ApiMessage.SUB_CATEGORY_FETCHED)
  findOne(@Param('id') id: string) {
    return this.subCategoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(SubCategoryResponseDto)
  @ResponseMessage(ApiMessage.SUB_CATEGORY_UPDATED)
  update(
    @Param('id') id: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
  ) {
    return this.subCategoriesService.update(id, updateSubCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(SubCategoryResponseDto)
  @ResponseMessage(ApiMessage.SUB_CATEGORY_DELETED)
  remove(@Param('id') id: string) {
    return this.subCategoriesService.remove(id);
  }
}
