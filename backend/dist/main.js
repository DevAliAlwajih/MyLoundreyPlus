"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const common_2 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_2.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors();
    const port = process.env.PORT || 5000;
    await app.listen(port);
    logger.log(`🚀 MyLoundreyPlus Backend is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map