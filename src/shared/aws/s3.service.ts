// import { S3Client } from '@aws-sdk/client-s3';
// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createHash } from 'crypto';
// import { Request } from 'express';
// import * as multer from 'multer';
// import { FileFilterCallback } from 'multer'; // FileFilterCallback 타입 추가
// import * as path from 'path';
// import { PrismaService } from '../prisma/prisma.service';
// import { AvailableMimeType } from './enums/mime.enum';

// @Injectable()
// export class AwsS3Service {
//   private readonly logger = new Logger(AwsS3Service.name);
//   // S3 클라이언트 인스턴스
//   private s3Client: S3Client;
//   private bucketName: string;
//   private region: string;

//   public constructor(
//     private configService: ConfigService,
//     private prismaService: PrismaService,
//   ) {
//     // S3Client 인스턴스 생성(.env에서 AWS 설정 환경변수 가져오기)
//     this.s3Client = new S3Client({
//       region: this.configService.getOrThrow<string>('AWS_S3_REGION'),
//       credentials: {
//         accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
//         secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
//       },
//     });
//     // 버킷 이름 설정
//     this.region = this.configService.getOrThrow<string>('AWS_S3_REGION');
//     this.bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');

//     // multerS3 설정
//     // this.multerS3Config = multerS3({
//     //   s3: this.s3Client,
//     //   bucket: this.bucketName,
//     //   acl: 'public-read',
//     //   contentType: multerS3.AUTO_CONTENT_TYPE,
//     //   key: (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => {
//     //     const fileHash = this.generateFileHash(file.buffer);
//     //     const extension = file.originalname.split('.').pop() || '';
//     //     const uniqueFileName = `${fileHash}.${extension}`;
//     //     cb(null, uniqueFileName);
//     //   },
//     // });
//   }

//   //TODO: Multer Options 설정
//   public createMulterOptions(): multer.Options {
//     return {
//       storage: multerS3({
//         s3: this.s3Client,
//         bucket: this.bucketName,
//         contentType: multerS3.AUTO_CONTENT_TYPE,
//         acl: 'public-read',
//         key: (
//           req: Express.Request,
//           file: Express.Multer.File,
//           cb: (error: any, key?: string) => void,
//         ) => {
//           // 업로드된 파일 해시를 생성
//           const fileHash = this.generateFileHash(file.buffer);
//           // 파일 확장자 추출
//           const extension = path.extname(file.originalname);
//           // TODO: [발전과제] 기본 폴더 경로(images) 대신 현재 로그인한 유저 ID를 폴더 경로로 지정하는 방법도 고민해볼 것
//           // const { userId } = this.prismaService.user.findUnique({
//           //   where: { id: this.prismaService.user.id },
//           // });
//           // const folder = userId ?? 'images';
//           // 고유한 파일 이름 생성(폴더 경로 + 파일 해시 + 확장자)
//           // 기본 폴더 경로는 images이며, 폴더 경로를 지정하지 않으면 기본 폴더에 업로드
//           const folder = 'images';
//           const uniqueFileName = `${folder}/${fileHash}${extension}`;
//           cb(null, uniqueFileName);
//         },
//       }),
//       fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
//         // 이미지 파일 확인(mime이 image/로 시작하고, MimeType에 포함되어 있는지 확인)
//         if (
//           file.mimetype.startsWith('image/') &&
//           Object.values(AvailableMimeType).includes(file.mimetype as AvailableMimeType)
//         ) {
//           // 이미지 파일이 맞으면 콜백 함수는 true를 반환
//           cb(null, true);
//         } else {
//           const allowedMimeTypes = Object.values(AvailableMimeType)
//             .join(', ')
//             .replace('image/', '');
//           const message = `이미지 파일만 업로드할 수 있습니다. 업로드 가능한 확장자는 ${allowedMimeTypes} 입니다.`;
//           const error = new BadRequestException(message);
//           // 오류를 반환하면(이미지 파일이 아니면) multer는 파일 업로드를 중단하고 오류 메시지를 반환
//           cb(error as unknown as null, false);
//         }
//       },
//       limits: {
//         fileSize: 5 * 1024 * 1024, // 최대 업로드 이미지 크기 5MB
//       },
//     };
//   }
//   //TODO: 파일 중복을 막기 위해 SHA-256 해시 생성
//   private generateFileHash(fileBuffer: Buffer): string {
//     return createHash('sha256').update(fileBuffer).digest('hex');
//   }

//   //TODO: 중복 파일 체크
//   private async checkDuplicateFile(uniqueFileName: string): Promise<boolean> {
//     // uniqueFileName(파일해시 + 확장자)을 통해 중복 파일 체크
//     const existingFile = await this.prismaService.s3Object.findUnique({
//       where: { uniqueFileName },
//     });
//     // 중복된 파일이 있으면 true, 없으면 false를 반환
//     return existingFile !== null;
//   }

//   //TODO: 메타데이터 DB에 저장
//   public async saveMetadata(metadata): Promise<void> {
//     // 메타데이터 저장 로직
//     await this.prismaService.s3Object.create({
//       data: metadata,
//     });
//     console.log(`메타데이터 저장: ${JSON.stringify(metadata)}`);
//   }

//   //TODO: Public 이미지 URL 반환
//   // 예: https://bucket-name.s3.ap-northeast-2.amazonaws.com/b3fc0bdb362ae22567f7f2498f75ce3740855b8cb0f333823ee3e82b80370aa2.jpg
//   public getPublicImageUrl(fileName: string): string {
//     return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
//   }

//   //TODO: 이미지 업로드
//   public async uploadImage(
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: any, key?: string) => void,
//   ): Promise<{
//     url: string;
//     message: string;
//   }> {
//     if (!file) {
//       throw new BadRequestException('파일이 업로드되지 않았습니다.');
//     }

//     // 업로드된 파일 해시를 생성
//     const fileHash = this.generateFileHash(file.buffer);
//     // 파일 확장자 추출
//     const extension = path.extname(file.originalname);
//     // 기본 폴더 경로 설정
//     const folder = 'images';
//     const uniqueFileName = `${folder}/${fileHash}${extension}`;

//     const isDuplicate = await this.checkDuplicateFile(uniqueFileName);
//     if (isDuplicate) {
//       throw new BadRequestException(`중복된 파일입니다.`);
//     }

//     try {
//       // const uploadCommand = new PutObjectCommand({
//       //   Bucket: this.bucketName,
//       //   Key: uniqueFileName,
//       //   Body: file.buffer,
//       //   ContentType: file.mimetype,
//       // });

//       const metadata = {
//         originalFileName: file.originalname,
//         uniqueFileName: uniqueFileName,
//         fileSize: file.size,
//         contentType: file.mimetype,
//         imageUrl: this.getPublicImageUrl(uniqueFileName),
//       };

//       await this.saveMetadata(metadata);
//       return {
//         url: metadata.imageUrl,
//         message: '이미지 업로드 성공',
//       };
//     } catch (error) {
//       console.error('이미지 업로드 에러:', error);
//       throw new BadRequestException('이미지 업로드에 실패했습니다.');
//     }
//   }
// }
