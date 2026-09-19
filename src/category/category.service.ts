import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiMessage } from '../common/enums/api-message.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.categoryModel
      .findOne({ name: createCategoryDto.name })
      .exec();

    if (existing) {
      throw new ConflictException({
        message: ApiMessage.CATEGORY_ALREADY_EXISTS,
        errors: { name: 'Category name is already taken' },
      });
    }

    return this.categoryModel.create(createCategoryDto);
  }

  findAll() {
    return this.categoryModel.find().sort({ createdAt: -1 }).exec();
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
      .findByIdAndUpdate(id, updateCategoryDto, { returnDocument: 'after' })
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
