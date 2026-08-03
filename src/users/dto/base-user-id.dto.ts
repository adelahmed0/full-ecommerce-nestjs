import { Expose, Transform } from 'class-transformer';

export class BaseUserIdDto {
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: { toString(): string }; id?: string } }) =>
      obj.id ?? obj._id?.toString(),
  )
  id: string;
}
