import { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { isPaginatedResult } from '../dto/paginated-result';

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

function toDtoInstance<T>(item: unknown, dto: Type<T>): T {
  return plainToInstance(dto, toPlain(item) as object, {
    excludeExtraneousValues: true,
  });
}

export function serializeToDto<T>(data: unknown, dto: Type<T>): unknown {
  if (isPaginatedResult(data)) {
    const serialized: Record<string, unknown> = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'pagination' && Array.isArray(value)) {
        serialized[key] = value.map((item) => toDtoInstance(item, dto));
      }
    }

    return serialized;
  }

  if (Array.isArray(data)) {
    return data.map((item) => toDtoInstance(item, dto));
  }

  return toDtoInstance(data, dto);
}
