// import { Global, Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MulterModule } from '@nestjs/platform-express';
// import { AwsS3Controller } from './s3.controller';
// import { AwsS3Service } from './s3.service';

// @Global()
// @Module({
//   imports: [
//     ConfigModule,
//     MulterModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService, AwsS3Service],
//       useFactory: (awsS3Service: AwsS3Service) => ({
//         storage: awsS3Service, // 커스텀 스토리지 엔진 사용
//       }),
//     }),
//   ],
//   controllers: [AwsS3Controller],
//   providers: [AwsS3Service],
//   exports: [AwsS3Service],
// })
// export class AwsS3Module {}
