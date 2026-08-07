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
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { FindBrandsQueryDto } from './dto/find-brands-query.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(BrandResponseDto)
  @ResponseMessage(ApiMessage.BRAND_CREATED)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN, UserRole.USER])
  @Serialize(BrandResponseDto)
  @ResponseMessage(ApiMessage.BRANDS_FETCHED)
  findAll(@Query() query: FindBrandsQueryDto) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN, UserRole.USER])
  @Serialize(BrandResponseDto)
  @ResponseMessage(ApiMessage.BRAND_FETCHED)
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(BrandResponseDto)
  @ResponseMessage(ApiMessage.BRAND_UPDATED)
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Serialize(BrandResponseDto)
  @ResponseMessage(ApiMessage.BRAND_DELETED)
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
