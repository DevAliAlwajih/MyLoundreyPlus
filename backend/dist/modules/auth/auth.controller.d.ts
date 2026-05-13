import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
            role: any;
            uniqueId: any;
        };
    }>;
}
