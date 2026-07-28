import { SetMetadata, Type } from '@nestjs/common';

export const SERIALIZE_KEY = 'serializeDto';

export const Serialize = (dto: Type) => SetMetadata(SERIALIZE_KEY, dto);
