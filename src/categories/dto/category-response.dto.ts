import { Expose, Transform } from 'class-transformer';
import { PublicAssetUrl } from '../../common/decorators/public-asset-url.decorator.js';

export class CategoryResponseDto {
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: { toString(): string }; id?: string } }) =>
      obj.id ?? obj._id?.toString(),
  )
  id: string;

  @Expose()
  name: string;

  @Expose()
  @PublicAssetUrl()
  image: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
