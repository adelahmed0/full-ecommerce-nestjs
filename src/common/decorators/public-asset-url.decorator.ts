import { Transform } from 'class-transformer';
import 'reflect-metadata';
import { toPublicUrl } from '../upload/public-url.util.js';

export const PUBLIC_ASSET_URL_KEYS = 'publicAssetUrlKeys';

type TransformOptionsWithOrigin = {
  publicOrigin?: string;
};

/**
 * Mark a DTO field as a public asset path.
 * Stored relative paths become absolute URLs during response serialization.
 */
export function PublicAssetUrl(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const keys: Array<string | symbol> =
      Reflect.getMetadata(PUBLIC_ASSET_URL_KEYS, target) ?? [];
    Reflect.defineMetadata(
      PUBLIC_ASSET_URL_KEYS,
      [...keys, propertyKey],
      target,
    );

    Transform(({ value, options }) => {
      const origin = (options as TransformOptionsWithOrigin).publicOrigin;
      if (!origin) {
        return (value as string | null | undefined) ?? null;
      }

      return toPublicUrl(value as string | null | undefined, origin);
    })(target, propertyKey);
  };
}

export function getPublicAssetUrlKeys(dtoPrototype: object): string[] {
  const keys: Array<string | symbol> =
    Reflect.getMetadata(PUBLIC_ASSET_URL_KEYS, dtoPrototype) ?? [];
  return keys.map(String);
}
