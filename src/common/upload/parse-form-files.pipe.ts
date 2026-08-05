import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { detectMimeFromBuffer } from './magic-bytes';
import {
  FormFileFieldRule,
  FormFileFieldsResult,
  UploadedMulterFile,
} from './upload.types';

function isUploadedMulterFile(value: object): value is UploadedMulterFile {
  return (
    'fieldname' in value &&
    typeof (value as UploadedMulterFile).fieldname === 'string' &&
    'mimetype' in value &&
    typeof (value as UploadedMulterFile).mimetype === 'string'
  );
}

function normalizeFiles(
  value:
    | UploadedMulterFile
    | UploadedMulterFile[]
    | Record<string, UploadedMulterFile[]>
    | undefined
    | null,
): UploadedMulterFile[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (isUploadedMulterFile(value)) {
    return [value];
  }

  return Object.values(value).flat();
}

@Injectable()
export class ParseFormFilesPipe implements PipeTransform {
  constructor(private readonly rules: FormFileFieldRule[]) {}

  transform(
    value:
      | UploadedMulterFile
      | UploadedMulterFile[]
      | Record<string, UploadedMulterFile[]>
      | undefined,
  ): FormFileFieldsResult {
    const allFiles = normalizeFiles(value);
    const allowedNames = new Set(this.rules.map((rule) => rule.name));
    const result: FormFileFieldsResult = {};

    const unexpected = allFiles.find(
      (file) => !allowedNames.has(file.fieldname),
    );
    if (unexpected) {
      throw new BadRequestException(
        `Unexpected file field: ${unexpected.fieldname}`,
      );
    }

    for (const rule of this.rules) {
      const matched = allFiles.filter((file) => file.fieldname === rule.name);
      this.assertField(rule, matched);
      result[rule.name] = matched;
    }

    return result;
  }

  private assertField(rule: FormFileFieldRule, files: UploadedMulterFile[]) {
    if (rule.required && files.length === 0) {
      throw new BadRequestException(`${rule.name} file is required`);
    }

    if (rule.maxCount !== undefined && files.length > rule.maxCount) {
      throw new BadRequestException(
        `${rule.name} allows at most ${rule.maxCount} file(s)`,
      );
    }

    if (!rule.mimeTypes?.length) {
      return;
    }

    const allowed = new Set(rule.mimeTypes);

    for (const file of files) {
      const detected = detectMimeFromBuffer(file.buffer);

      if (!detected || !allowed.has(detected)) {
        throw new BadRequestException(
          `${rule.name} has invalid or spoofed file type`,
        );
      }

      // Normalize header to the trusted detected type.
      file.mimetype = detected;
    }
  }
}

/** Factory helper so controllers stay readable. */
export const parseFormFiles = (rules: FormFileFieldRule[]) =>
  new ParseFormFilesPipe(rules);
