import { SetMetadata } from '@nestjs/common';
import { ApiMessage } from '../enums/api-message.enum';

export const RESPONSE_MESSAGE_KEY = 'responseMessage';

export const ResponseMessage = (message: ApiMessage) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
