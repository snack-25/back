import { BadRequestException, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MulterModule } from '@nestjs/platform-express'; // Multer 모듈 등록
import { extname } from 'path';
import * as multer from 'multer';
import { PRODUCTS_IMAGE_PATH } from 'src/shared/const/path';
import { createId } from '@paralleldrive/cuid2';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 1024 * 1024 * 5, // 바이트 단위로 입력 = 5MB (파일 크기 제한, 5MB 이하만 업로드 가능. 5MB 넘는 파일 업로드 시 에러 발생),
      },
      fileFilter: (req, file, cb) => {
        /**
         * cb(param1, param2)
         * param1: 에러 객체 (에러 정보)
         * param2: boolean (파일 다운로드 허가/거부)
         */
        // file이나 originalname이 없는 경우 에러 처리
        if (!file || !file.originalname) {
          return cb(new BadRequestException('Invalid file information'), false);
        }
        const ext = extname(file.originalname); // 파일 확장자 추출 xxx.jpg -> .jpg
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']; // 허가된 확장자 목록
        // 허가된 확장자 목록에 없으면 에러 발생
        if (!allowedExts.includes(ext)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        // 에러 없이 통과했을 때(다운로드 진행)
        return cb(null, true);
      },
      storage: multer.diskStorage({
        // 다운로드한 파일의 저장 위치(폴더까지만 입력) {프로젝트 위치}/public/products
        destination: (req, file, cb) => {
          cb(null, PRODUCTS_IMAGE_PATH);
        },
        // 다운로드한 파일의 이름(중복방지를 위해 cuid2 사용)
        filename: (req, file, cb: (error: Error | null, filename: string) => void) => {
          // file이나 originalname이 없는 경우 에러 처리
          if (!file || !file.originalname) {
            return cb(new BadRequestException('Invalid file information'), '');
          }
          const filename = `${createId()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
    }),
  ],
})
export class ProductsModule {}
