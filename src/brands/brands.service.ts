import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiMessage } from '../common/enums/api-message.enum';
import { buildPaginatedResult } from '../common/dto/paginated-result';
import { CreateBrandDto } from './dto/create-brand.dto';
import { FindBrandsQueryDto } from './dto/find-brands-query.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './schemas/brand.schema';

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private brandModel: Model<Brand>) {}

  async create(createBrandDto: CreateBrandDto) {
    const existing = await this.brandModel.findOne({
      name: createBrandDto.name,
    });
    if (existing) {
      throw new ConflictException({
        message: ApiMessage.BRAND_ALREADY_EXISTS,
        errors: { name: 'Brand name is already taken' },
      });
    }

    return this.brandModel.create(createBrandDto);
  }

  async findAll(query: FindBrandsQueryDto) {
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

    const [brands, total] = await Promise.all([
      this.brandModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * per_page)
        .limit(per_page)
        .exec(),
      this.brandModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult('brands', brands, total, page, per_page);
  }

  async findOne(id: string) {
    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException(ApiMessage.BRAND_NOT_FOUND);
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    if (updateBrandDto.name) {
      const nameTaken = await this.brandModel.exists({
        name: updateBrandDto.name,
        _id: { $ne: id },
      });
      if (nameTaken) {
        throw new ConflictException({
          message: ApiMessage.BRAND_ALREADY_EXISTS,
          errors: { name: 'Brand name is already taken' },
        });
      }
    }

    const brand = await this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, { new: true })
      .exec();

    if (!brand) {
      throw new NotFoundException(ApiMessage.BRAND_NOT_FOUND);
    }

    return brand;
  }

  async remove(id: string) {
    const brand = await this.brandModel.findByIdAndDelete(id).exec();
    if (!brand) {
      throw new NotFoundException(ApiMessage.BRAND_NOT_FOUND);
    }
    return brand;
  }
}
