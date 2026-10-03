"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RechargeBalanceDto = void 0;
const class_validator_1 = require("class-validator");
class RechargeBalanceDto {
}
exports.RechargeBalanceDto = RechargeBalanceDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'المبلغ مطلوب' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'المبلغ يجب أن يكون رقماً صالحاً' }),
    (0, class_validator_1.Min)(0.01, { message: 'المبلغ يجب أن يكون أكبر من 0' }),
    __metadata("design:type", Number)
], RechargeBalanceDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['cash', 'bank_transfer', 'cheque', 'electronic', 'other'], {
        message: 'طريقة الدفع غير صالحة',
    }),
    __metadata("design:type", String)
], RechargeBalanceDto.prototype, "payment_method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RechargeBalanceDto.prototype, "reference_number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RechargeBalanceDto.prototype, "notes", void 0);
//# sourceMappingURL=recharge-balance.dto.js.map