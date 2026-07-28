import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Per page must be an integer' })
  @Min(1, { message: 'Per page must be at least 1' })
  @Max(100, { message: 'Per page must be at most 100' })
  per_page = 10;
}
