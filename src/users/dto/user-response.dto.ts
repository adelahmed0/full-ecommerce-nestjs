import { Expose, Transform } from 'class-transformer';
import { UserRole, UserGender, UserActive } from '../enums/user.enum';

export class UserResponseDto {
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: { toString(): string }; id?: string } }) =>
      obj.id ?? obj._id?.toString(),
  )
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  avatar: string | null;

  @Expose()
  age: number | null;

  @Expose()
  phoneNumber: string | null;

  @Expose()
  address: string | null;

  @Expose()
  active: UserActive;

  @Expose()
  gender: UserGender | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
