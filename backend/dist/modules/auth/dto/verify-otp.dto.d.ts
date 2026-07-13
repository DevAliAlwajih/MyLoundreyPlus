export declare class VerifyOtpDto {
    email: string;
    otp: string;
    deviceInfo?: {
        deviceId?: string;
        deviceType?: string;
        deviceOs?: string;
        deviceModel?: string;
        fcmToken?: string;
    };
}
