// import { S3Client } from '@aws-sdk/client-s3';
// import multerS3 from 'multer-s3-extended';

// export interface MulterS3Config extends multerS3 {
//   s3: S3Client;
//   bucket: string;
//   acl: string;
//   mimeType: string;
//   contentType: string;
//   key: (
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, key?: string) => void,
//   ) => void;
//   limits: {
//     fileSize: number;
//   };
// }

// export interface S3ClientConfig {
//   region: string | undefined;
//   credentials: {
//     accessKeyId: string;
//     secretAccessKey: string;
//   };
// }
