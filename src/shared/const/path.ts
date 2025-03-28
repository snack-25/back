import { join } from 'path';

// 서버 프로젝트의 루트 폴더(절대 경로)
export const PROJECT_ROOT_PATH = process.cwd();

// 외부에서 접근 가능한 파일을 모아둔 폴더 이름
export const PUBLIC_FOLDER_NAME = 'public';

// 상품 이미지들을 저장할 폴더 이름
export const PRODUCTS_FOLDER_NAME = 'products';

// 실제 공개폴더의 절대 경로 {프로젝트 위치}/public
export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME);

// 상품 이미지 폴더의 절대 경로 {프로젝트 위치}/public/products
export const PRODUCTS_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, PRODUCTS_FOLDER_NAME);

// GET 요청으로 이미지 주소를 보내 줄 때 사용할 상대 경로 /public/products/
export const PRODUCTS_PUBLIC_IMAGE_PATH = join(PUBLIC_FOLDER_NAME, PRODUCTS_FOLDER_NAME);
