export declare class VerifyOtpDto {
    phoneNumber: string;
    otp: string;
    deviceInfo?: {
        deviceId?: string;
        deviceType?: string;
        deviceOs?: string;
        deviceModel?: string;
        fcmToken?: string;
    };
}
