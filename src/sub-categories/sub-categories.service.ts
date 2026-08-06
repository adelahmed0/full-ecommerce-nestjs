import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoriesService } from '../categories/categories.service';
import { ApiMessage } from '../common/enums/api-message.enum';
import { buildPaginatedResult } from '../common/dto/paginated-result';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { FindSubCategoriesQueryDto } from './dto/find-sub-categories-query.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { SubCategory } from './schemas/sub-category.schema';

@Injectable()
export class SubCategoriesService {
  constructor(
    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategory>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createSubCategoryDto: CreateSubCategoryDto) {
    await this.categoriesService.findOne(createSubCategoryDto.category);

    const existing = await this.subCategoryModel.findOne({
      name: createSubCategoryDto.name,
      category: createSubCategoryDto.category,
    });
    if (existing) {
      throw new ConflictException({
        message: ApiMessage.SUB_CATEGORY_ALREADY_EXISTS,
        errors: {
          name: 'Sub category name is already taken in this category',
        },
      });
    }

    return this.subCategoryModel.create(createSubCategoryDto);
  }

  async findAll(query: FindSubCategoriesQueryDto) {
    const {
      page,
      per_page,
      search,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    const [subCategories, total] = await Promise.all([
      this.subCategoryModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * per_page)
        .limit(per_page)
        .exec(),
      this.subCategoryModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      'subCategories',
      subCategories,
      total,
      page,
      per_page,
    );
  }

  async findOne(id: string) {
    const subCategory = await this.subCategoryModel.findById(id).exec();
    if (!subCategory) {
      throw new NotFoundException(ApiMessage.SUB_CATEGORY_NOT_FOUND);
    }
    return subCategory;
  }

  async update(id: string, updateSubCategoryDto: UpdateSubCategoryDto) {
    const current = await this.findOne(id);

    if (updateSubCategoryDto.category) {
      await this.categoriesService.findOne(updateSubCategoryDto.category);
    }

    const nextName = updateSubCategoryDto.name ?? current.name;
    const nextCategory =
      updateSubCategoryDto.category ?? String(current.category);

    const nameTaken = await this.subCategoryModel.exists({
      name: nextName,
      category: nextCategory,
      _id: { $ne: id },
    });
    if (nameTaken) {
      throw new ConflictException({
        message: ApiMessage.SUB_CATEGORY_ALREADY_EXISTS,
        errors: {
          name: 'Sub category name is already taken in this category',
        },
      });
    }

    const subCategory = await this.subCategoryModel
      .findByIdAndUpdate(id, updateSubCategoryDto, { new: true })
      .exec();

    if (!subCategory) {
      throw new NotFoundException(ApiMessage.SUB_CATEGORY_NOT_FOUND);
    }

    return subCategory;
  }

  async remove(id: string) {
    const subCategory = await this.subCategoryModel.findByIdAndDelete(id).exec();
    if (!subCategory) {
      throw new NotFoundException(ApiMessage.SUB_CATEGORY_NOT_FOUND);
    }
    return subCategory;
  }
}
