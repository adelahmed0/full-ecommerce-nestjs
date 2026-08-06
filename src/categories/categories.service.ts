import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiMessage } from '../common/enums/api-message.enum';
import { buildPaginatedResult } from '../common/dto/paginated-result';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FindCategoriesQueryDto } from './dto/find-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.categoryModel.findOne({
      name: createCategoryDto.name,
    });
    if (existing) {
      throw new ConflictException({
        message: ApiMessage.CATEGORY_ALREADY_EXISTS,
        errors: { name: 'Category name is already taken' },
      });
    }

    return this.categoryModel.create(createCategoryDto);
  }

  async findAll(query: FindCategoriesQueryDto) {
    const {
      page,
      per_page,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * per_page)
        .limit(per_page)
        .exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      'categories',
      categories,
      total,
      page,
      per_page,
    );
  }

  async findOne(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(ApiMessage.CATEGORY_NOT_FOUND);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    if (updateCategoryDto.name) {
      const nameTaken = await this.categoryModel.exists({
        name: updateCategoryDto.name,
        _id: { $ne: id },
      });
      if (nameTaken) {
        throw new ConflictException({
          message: ApiMessage.CATEGORY_ALREADY_EXISTS,
          errors: { name: 'Category name is already taken' },
        });
      }
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException(ApiMessage.CATEGORY_NOT_FOUND);
    }

    return category;
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!category) {
      throw new NotFoundException(ApiMessage.CATEGORY_NOT_FOUND);
    }
    return category;
  }
}
