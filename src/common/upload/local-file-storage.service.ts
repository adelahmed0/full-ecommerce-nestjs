import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { UploadedMulterFile } from './upload.types.js';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

@Injectable()
export class LocalFileStorageService {
  private readonly uploadRoot: string;
  private readonly publicBasePath: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadRoot = resolve(
      this.configService.get<string>('UPLOAD_DIR') ?? 'uploads',
    );
    const base =
      this.configService.get<string>('UPLOAD_PUBLIC_BASE_PATH') ?? '/uploads';
    this.publicBasePath = base.endsWith('/') ? base.slice(0, -1) : base;
  }

  getUploadRoot(): string {
    return this.uploadRoot;
  }

  getPublicBasePath(): string {
    return this.publicBasePath;
  }

  async save(file: UploadedMulterFile, folder: string): Promise<string> {
    if (!file.buffer?.length) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const fromMime = MIME_TO_EXT[file.mimetype];
    const fromName = extname(file.originalname).toLowerCase();
    const ext = fromMime ?? (fromName || '');
    const filename = `${randomUUID()}${ext}`;
    const absolutePath = join(this.uploadRoot, folder, filename);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return `${this.publicBasePath}/${folder}/${filename}`;
  }

  async deleteIfLocal(publicPath: string | null | undefined): Promise<void> {
    if (!publicPath?.startsWith(`${this.publicBasePath}/`)) {
      return;
    }

    const relative = publicPath.slice(this.publicBasePath.length + 1);
    const absolutePath = resolve(this.uploadRoot, relative);
    const normalizedRoot = normalize(this.uploadRoot + sep);

    if (!normalize(absolutePath).startsWith(normalizedRoot)) {
      return;
    }

    await unlink(absolutePath).catch(() => undefined);
  }
}
