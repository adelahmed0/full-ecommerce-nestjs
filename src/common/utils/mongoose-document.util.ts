import { Schema } from 'mongoose';

type DocumentRet = Record<string, unknown> & {
  _id?: unknown;
  id?: string;
};

export function createDocumentTransform(omitFields: string[] = []) {
  return (_doc: unknown, ret: DocumentRet) => {
    ret.id = String(ret._id);
    delete ret._id;

    for (const field of omitFields) {
      delete ret[field];
    }

    return ret;
  };
}

export function applyDocumentJsonTransform(
  schema: Schema,
  options?: { omitFields?: string[] },
) {
  const transform = createDocumentTransform(options?.omitFields);

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform,
  });

  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform,
  });
}
