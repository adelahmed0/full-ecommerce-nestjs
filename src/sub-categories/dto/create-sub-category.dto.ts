import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSubCategoryDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(20, { message: 'Name must be at most 20 characters' })
  name: string;

  @IsNotEmpty({ message: 'Category is required' })
  @IsMongoId({ message: 'Category must be a valid Mongo ID' })
  category: string;
}
