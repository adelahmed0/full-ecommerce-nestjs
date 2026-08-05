export type UploadedMulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
};

export type FormFileFieldRule = {
  name: string;
  maxCount?: number;
  required?: boolean;
  /** Allowed MIME types (validated via magic bytes, not client header). */
  mimeTypes?: readonly string[];
};

export type FormFileFieldsResult = Record<string, UploadedMulterFile[]>;
