import fs from 'fs';
import path from 'path';
import { BadRequestException, Logger } from '@nestjs/common';

/**
 * JSON 파일을 읽어서 지정된 타입으로 반환합니다.
 * 파일이 없거나 JSON 파싱에 실패할 경우 예외를 발생시킵니다.
 * @param fileName 읽을 파일 이름
 * @returns 파싱된 JSON 데이터
 */
export const loadJsonFile = <T>(fileName: string): T => {
  try {
    const filePath = path.join(__dirname, 'const', fileName);

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`파일을 찾을 수 없습니다: ${fileName}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    try {
      return JSON.parse(fileContent) as T;
    } catch (parseError) {
      Logger.error(
        `JSON 파싱 실패 (${fileName}): ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
      throw new BadRequestException(`JSON 파싱 실패: ${fileName}`);
    }
  } catch (error) {
    // 파일 읽기 실패 등의 다른 모든 오류
    if (!(error instanceof BadRequestException)) {
      Logger.error(
        `파일 읽기 실패 (${fileName}): ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException(`파일 읽기 실패: ${fileName}`);
    }
    throw error;
  }
};
