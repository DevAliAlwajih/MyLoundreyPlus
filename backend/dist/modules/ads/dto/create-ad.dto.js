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
exports.CreateAdDto = exports.AdTarget = void 0;
const class_validator_1 = require("class-validator");
var AdTarget;
(function (AdTarget) {
    AdTarget["all"] = "all";
    AdTarget["customers"] = "customers";
    AdTarget["laundries"] = "laundries";
})(AdTarget || (exports.AdTarget = AdTarget = {}));
class CreateAdDto {
    constructor() {
        this.targetAudience = AdTarget.all;
        this.sortOrder = 0;
    }
}
exports.CreateAdDto = CreateAdDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateAdDto.prototype, "mediaUrls", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "bodyText", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "linkUrl", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AdTarget),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "targetAudience", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAdDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "endDate", void 0);
//# sourceMappingURL=create-ad.dto.js.map