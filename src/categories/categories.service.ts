import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiMessage } from '../common/enums/api-message.enum.js';
import { LocalFileStorageService } from '../common/upload/local-file-storage.service.js';
import type { UploadedMulterFile } from '../common/upload/upload.types.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Category, CategoryDocument } from './schemas/category.schema.js';

const CATEGORY_IMAGE_FOLDER = 'categories';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly fileStorage: LocalFileStorageService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    imageFile?: UploadedMulterFile,
  ) {
    const existing = await this.categoryModel
      .findOne({ name: createCategoryDto.name })
      .exec();

    if (existing) {
      throw new ConflictException({
        message: ApiMessage.CATEGORY_ALREADY_EXISTS,
        errors: { name: 'Category name is already taken' },
      });
    }

    const image = imageFile
      ? await this.fileStorage.save(imageFile, CATEGORY_IMAGE_FOLDER)
      : (createCategoryDto.image ?? null);

    return this.categoryModel.create({
      ...createCategoryDto,
      image,
    });
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

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    imageFile?: UploadedMulterFile,
  ) {
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

    const existing = await this.categoryModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(ApiMessage.CATEGORY_NOT_FOUND);
    }

    const patch: UpdateCategoryDto = { ...updateCategoryDto };

    if (imageFile) {
      patch.image = await this.fileStorage.save(
        imageFile,
        CATEGORY_IMAGE_FOLDER,
      );
      await this.fileStorage.deleteIfLocal(existing.image);
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, patch, { returnDocument: 'after' })
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

    await this.fileStorage.deleteIfLocal(category.image);
    return category;
  }
}
