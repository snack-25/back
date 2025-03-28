// import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { AwsS3Service } from './s3.service';

// @Controller('s3')
// export class AwsS3Controller {
//   public constructor(private readonly awsS3Service: AwsS3Service) {}

//   @Post('upload')
//   @UseInterceptors(FileInterceptor('file'))
//   public async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{
//     url: string;
//     message: string;
//   }> {
//     return this.awsS3Service.uploadImage(file);
//   }
// }
