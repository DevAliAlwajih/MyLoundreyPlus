import { Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        data: {
            message: string;
            accessToken: string;
            refreshToken: string;
            user: {
                id: any;
                fullName: any;
                email: any;
                role: any;
                uniqueId: any;
            };
        };
    }>;
    login(dto: LoginDto, req: any, ip: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    debugUser(email: string): Promise<{
        message: string;
        inputEmail: string;
        normalizedEmail: string;
        exactMatchFound: boolean;
        exactMatchDetails: {
            id: string;
            emailInDB: string;
            isActive: boolean;
            hasPassword: boolean;
        };
        caseInsensitiveMatchFound: boolean;
        caseInsensitiveDetails: {
            id: string;
            emailInDB: string;
            isActive: boolean;
            hasPassword: boolean;
        };
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto, req: any, ip: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    updateMe(req: any, dto: UpdateMeDto): Promise<{
        success: boolean;
        data: {
            id: string;
            fullName: string;
            uniqueId: string;
            role: import(".prisma/client").$Enums.user_role;
            email: string;
        };
    }>;
    requestEmailChange(req: any, dto: RequestEmailChangeDto): Promise<{
        success: boolean;
        message: string;
    }>;
    confirmEmailChange(req: any, dto: ConfirmEmailChangeDto): Promise<{
        success: boolean;
        data: {
            id: string;
            fullName: string;
            uniqueId: string;
            role: import(".prisma/client").$Enums.user_role;
            email: string;
        };
        message: string;
    }>;
    adminLogin(dto: AdminLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    googleAuth(): Promise<void>;
    googleCallback(req: any, res: Response): Promise<void>;
}
