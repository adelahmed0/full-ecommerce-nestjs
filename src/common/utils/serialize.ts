import { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

function toPlain(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    'toObject' in value &&
    typeof (value as { toObject: () => unknown }).toObject === 'function'
  ) {
    return (value as { toObject: () => unknown }).toObject();
  }

  return value;
}

export function serializeToDto<T>(data: unknown, dto: Type<T>): T | T[] {
  if (Array.isArray(data)) {
    return data.map((item) =>
      plainToInstance(dto, toPlain(item) as object, {
        excludeExtraneousValues: true,
      }),
    );
  }

  return plainToInstance(dto, toPlain(data) as object, {
    excludeExtraneousValues: true,
  });
}
