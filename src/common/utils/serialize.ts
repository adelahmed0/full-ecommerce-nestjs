import { Type } from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { getPublicAssetUrlKeys } from '../decorators/public-asset-url.decorator.js';
import { isPaginatedResult } from '../dto/paginated-result.js';
import { toPublicUrl } from '../upload/public-url.util.js';

export type SerializeDtoOptions = ClassTransformOptions & {
  publicOrigin?: string;
};

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

function applyPublicAssetUrls(
  instance: object,
  dto: Type,
  publicOrigin?: string,
): object {
  if (!publicOrigin) {
    return instance;
  }

  const keys = getPublicAssetUrlKeys(dto.prototype as object);
  const record = instance as Record<string, unknown>;

  for (const key of keys) {
    record[key] = toPublicUrl(
      record[key] as string | null | undefined,
      publicOrigin,
    );
  }

  return instance;
}

function toDtoInstance<T>(
  item: unknown,
  dto: Type<T>,
  options?: SerializeDtoOptions,
): T {
  const instance = plainToInstance(dto, toPlain(item) as object, {
    excludeExtraneousValues: true,
    ...options,
  });

  return applyPublicAssetUrls(
    instance as object,
    dto as Type,
    options?.publicOrigin,
  ) as T;
}

export function serializeToDto<T>(
  data: unknown,
  dto: Type<T>,
  options?: SerializeDtoOptions,
): unknown {
  if (isPaginatedResult(data)) {
    const serialized: Record<string, unknown> = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'pagination' && Array.isArray(value)) {
        serialized[key] = value.map((item) =>
          toDtoInstance(item, dto, options),
        );
      }
    }

    return serialized;
  }

  if (Array.isArray(data)) {
    return data.map((item) => toDtoInstance(item, dto, options));
  }

  return toDtoInstance(data, dto, options);
}
