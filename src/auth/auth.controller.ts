import { Body, Controller, Post } from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { Serialize } from '../common/decorators/serialize.decorator.js';
import { ApiMessage } from '../common/enums/api-message.enum.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Serialize(AuthResponseDto)
  @ResponseMessage(ApiMessage.SIGNED_UP)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  @Serialize(AuthResponseDto)
  @ResponseMessage(ApiMessage.SIGNED_IN)
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('forgot-password')
  @ResponseMessage(ApiMessage.FORGOT_PASSWORD_EMAIL_SENT)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-reset-code')
  @ResponseMessage(ApiMessage.RESET_CODE_VERIFIED)
  verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(verifyResetCodeDto);
  }

  @Post('reset-password')
  @ResponseMessage(ApiMessage.PASSWORD_RESET)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
