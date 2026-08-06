import { Expose, Transform } from 'class-transformer';

export class SubCategoryResponseDto {
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: { toString(): string }; id?: string } }) =>
      obj.id ?? obj._id?.toString(),
  )
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(
    ({
      obj,
    }: {
      obj: {
        category?:
          | string
          | { _id?: { toString(): string }; id?: string; toString(): string };
      };
    }) => {
      const category = obj.category;
      if (category == null) return category;
      if (typeof category === 'string') return category;
      return category.id ?? category._id?.toString() ?? String(category);
    },
  )
  category: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
