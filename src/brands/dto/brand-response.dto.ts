import { Expose, Transform } from 'class-transformer';

export class BrandResponseDto {
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: { toString(): string }; id?: string } }) =>
      obj.id ?? obj._id?.toString(),
  )
  id: string;

  @Expose()
  name: string;

  @Expose()
  image: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
