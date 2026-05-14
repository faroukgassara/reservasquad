import { Controller, Post, Body, Res, HttpStatus, Req, Query, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from 'src/dto/login/login.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { EJwtStrategy } from 'src/enum/common.enum';
import { LangDto } from 'src/dto/appConfiguration/lang.dto';
import { IRequest } from 'src/interface/request/request.interface';
import { RequestResetPasswordDto } from 'src/dto/login/requestResetPassword.dto';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Response } from 'express';
import { ValidateResetPasswordTokenDto } from 'src/dto/login/validateResetPasswordToken.dto';
import { ResetPasswordDto } from 'src/dto/login/resetPassword.dto';
import * as swagger from '@nestjs/swagger';
import { ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { normalizeEmail } from 'src/common/utils/email.util';
import { RegisterDto } from 'src/dto/auth/register.dto';

@swagger.ApiTags('auth')
@Controller('auth')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: "NOT_FOUND" },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' }
)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('register')
    @Public(true)
    @swagger.ApiBody({ type: RegisterDto })
    @ApiOperation({
        summary: 'Teacher self-registration',
        description: 'Creates a TEACHER account and returns JWT tokens.',
    })
    async register(
        @Body() dto: RegisterDto,
        @Res() res: Response,
    ) {
        try {
            const response = await this.authService.register(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: response,
            });
        } catch (error) {
            if (error instanceof HttpException) {
                return res.status(error.getStatus()).json({
                    statusCode: error.getStatus(),
                    ...(typeof error.getResponse() === 'object' && error.getResponse() !== null
                        ? error.getResponse() as Record<string, unknown>
                        : { message: error.getResponse() }),
                });
            }
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            });
        }
    }

    @Post('login')
    @Public(true)
    @swagger.ApiBody({ type: LoginDTO })
    @ApiOperation({
        summary: 'User login',
        description: 'Authenticates the user with email and password. Returns a JWT token if credentials are valid. Archived users are not allowed to log in.',
    })
    @swagger.ApiOkResponse({
        description: 'Authenticated successfully',
    })
    async login(
        @Body() dto: LoginDTO,
        @Res() res
    ) {
        try {

            const normalizedEmail = normalizeEmail(dto.email);

            const user = await this.authService.findUserByEmail(normalizedEmail);
            if (!user) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    error: 'User not found.',
                });
            }

            const response = await this.authService.login({ ...dto, email: normalizedEmail });
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: response,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error,
            });
        }
    }

    @Post('refresh-token')
    @Public(false, EJwtStrategy.refreshToken)
    @ApiBearerAuth('Authorization')
    @ApiHeader({
        name: 'Authorization',
        description: 'Bearer RefreshToken',
        required: true,
    })
    @ApiOperation({
        summary: 'Refresh access token',
        description: 'This endpoint requires the refresh token to be passed in the Authorization header as a Bearer token.',
    })
    @swagger.ApiOkResponse({
        description: 'Token refreshed successfully',
    })
    async refresh(
        @Res() res,
        @Req() req,
    ) {
        try {
            const { user } = req
            const userData = await this.authService.findUserByEmail(user?.email);
            if (!userData) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    error: 'User not found.',
                });
            }

            const response = await this.authService.refreshTokens(user);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: response,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error,
            });
        }
    }

    @Post('logout')
    @Public(false, EJwtStrategy.refreshToken)
    @ApiBearerAuth('Authorization')
    @ApiHeader({
        name: 'Authorization',
        description: 'Bearer RefreshToken',
        required: true,
    })
    @ApiOperation({
        summary: 'Logout user',
        description: 'Invalidates the active refresh token chain for the user.',
    })
    async logout(
        @Res() res,
        @Req() req,
    ) {
        try {
            const { user } = req;

            await this.authService.logout(user);

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Logged out successfully.',
            });
        } catch (error) {
            const statusCode = error instanceof HttpException
                ? error.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
            const response = error instanceof HttpException
                ? error.getResponse()
                : error;
            return res.status(statusCode).json({
                statusCode,
                error: response,
            });
        }
    }

    @Post('/request-reset-password')
    @Public(true)
    @swagger.ApiBody({ type: RequestResetPasswordDto })
    @ApiOperation({
        summary: 'Request password reset',
        description: 'Allows a user or an admin to request a password reset. Sends a reset link by email if the user exists and is not archived.',
    })
    async resetPasswordRequest(
        @Res() res: Response,
        @Query() query: LangDto,
        @Body() body: RequestResetPasswordDto,
        @Req() req: IRequest
    ) {
        try {
            const { email } = body;
            const normalizedEmail = normalizeEmail(email);
            const user = await this.authService.findUserByEmail(normalizedEmail);
            if (!user) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    error: 'User not found.',
                });
            }
            await this.authService.generateResetToken(normalizedEmail)
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Password reset request sent successfully.'
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            });
        }
    }

    @Post('/validate-reset-password-token')
    @Public(true)
    @swagger.ApiBody({ type: ValidateResetPasswordTokenDto })
    @ApiOperation({
        summary: 'Validate reset password token',
        description: 'Verifies that a reset password token is valid and the associated user exists and is not archived.',
    })
    async validateResetPasswordToken(
        @Res() res: Response,
        @Query() query: LangDto,
        @Body() body: ValidateResetPasswordTokenDto,
        @Req() req: IRequest
    ) {
        try {
            const { token } = body
            const user = await this.authService.validateResetToken(token);
            if (!user) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: 'Invalid token.',
                });
            }

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Valid token.'
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            });
        }
    }

    @Post('/reset-password')
    @Public(true)
    @swagger.ApiBody({ type: ResetPasswordDto })
    @ApiOperation({
        summary: 'Reset user password',
        description: 'Allows a user to reset their password using a valid token received via email. Validates that the user is not archived.',
    })
    async resetPassword(
        @Res() res: Response,
        @Query() query: LangDto,
        @Body() body: ResetPasswordDto,
        @Req() req: IRequest
    ) {
        try {
            const { token, newPassword } = body
            const userUpdated = await this.authService.resetPasswordWithToken(token, newPassword);
            if (!userUpdated) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: 'Invalid token.',
                });
            }
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Password updated successfully.',
                data: {
                    email: userUpdated.email,
                },
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            });
        }
    }
}
