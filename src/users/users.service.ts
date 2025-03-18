/* eslint-disable no-useless-escape */
import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CheckEmailRequestDto, CheckEmailResponseDto, CheckNameDto } from './dto/user.dto';
import { CompaniesRequestDto } from '@src/companies/dto/companies.dto';

@Injectable()
export class UsersService {
  public constructor(private prisma: PrismaService) {}

  // 기업조회
  public async checkCompany(companiesRequestDto: CompaniesRequestDto): Promise<boolean> {
    const { name, bizno } = companiesRequestDto;
    // 중복 체크
    const existing = await this.prisma.company.findFirst({
      where: {
        OR: [{ bizno: bizno }, { name: name }],
      },
    });

    // 사업자 등록번호가 이미 존재하면 오류 발생
    if (existing) {
      throw new BadRequestException('이미 존재하는 회사입니다.');
    }

    // 사업자 등록번호가 없으면 DTO 그대로 반환
    return true;
  }

  //이름 체크
  public checkName(CheckNameDto: CheckNameDto): Promise<CheckNameDto> {
    // 이름이 비어있거나 길이 제한을 초과하는지 확인
    if (
      !CheckNameDto ||
      !CheckNameDto.name ||
      CheckNameDto.name.length < 2 ||
      CheckNameDto.name.length > 50
    ) {
      throw new BadRequestException('이름은 최소 2자, 최대 50자여야 합니다.');
    }
    // 영어 대소문자, 숫자, 한글만 허용 (특수문자 및 띄어쓰기는 허용하지 않음)
    const nameRegex = /^[A-Za-z0-9\uAC00-\uD7A3]+$/;
    if (!nameRegex.test(CheckNameDto.name)) {
      throw new BadRequestException('이름에 특수문자나 띄어쓰기를 사용할 수 없습니다.');
    }
    // 유효성 검사를 통과하면 입력받은 객체를 그대로 Promise로 감싸서 반환
    return Promise.resolve(CheckNameDto);
  }

  // 사용자 이메일 중복 체크
  public async checkEmail(
    checkEmailRequestDto: CheckEmailRequestDto,
  ): Promise<CheckEmailResponseDto> {
    // 1. email 형식이 유효한지 확인 { message: '유효하지 않은 이메일 형식입니다.' }
    // 2. email이 DB에 이미 존재하는지 확인
    // 2-1. 존재하면 ConflictException 예외 발생 { message: '이미 사용 중인 이메일입니다.' }
    // 2-2. 존재하지 않으면 사용 가능 메시지 반환 { message: '사용 가능한 이메일입니다.' }

    // RFC 6531에 따른 이메일 정규식
    const emailRegex =
      /^(?<localPart>(?<dotString>[0-9a-z!#$%&'*+\-\/=?^_`\{|\}~\u{80}-\u{10FFFF}]+(\.[0-9a-z!#$%&'*+\-\/=?^_`\{|\}~\u{80}-\u{10FFFF}]+)*)|(?<quotedString>"([\x20-\x21\x23-\x5B\x5D-\x7E\u{80}-\u{10FFFF}]|\\[\x20-\x7E])*"))(?<!.{64,})@(?<domainOrAddressLiteral>(?<addressLiteral>\[((?<IPv4>\d{1,3}(\.\d{1,3}){3})|(?<IPv6Full>IPv6:[0-9a-f]{1,4}(:[0-9a-f]{1,4}){7})|(?<IPv6Comp>IPv6:([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,5})?::([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,5})?)|(?<IPv6v4Full>IPv6:[0-9a-f]{1,4}(:[0-9a-f]{1,4}){5}:\d{1,3}(\.\d{1,3}){3})|(?<IPv6v4Comp>IPv6:([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,3})?::([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,3}:)?\d{1,3}(\.\d{1,3}){3})|(?<generalAddressLiteral>[a-z0-9\-]*[[a-z0-9]:[\x21-\x5A\x5E-\x7E]+))\])|(?<Domain>(?!.{256,})(([0-9a-z\u{80}-\u{10FFFF}]([0-9a-z\-\u{80}-\u{10FFFF}]*[0-9a-z\u{80}-\u{10FFFF}])?))(\.([0-9a-z\u{80}-\u{10FFFF}]([0-9a-z\-\u{80}-\u{10FFFF}]*[0-9a-z\u{80}-\u{10FFFF}])?))*))$/iu;

    if (typeof checkEmailRequestDto.email !== 'string') {
      throw new BadRequestException('이메일은 문자열이어야 합니다.');
    }

    if (!emailRegex.test(checkEmailRequestDto.email)) {
      throw new BadRequestException('유효하지 않은 이메일 형식입니다.');
    }

    try {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: checkEmailRequestDto.email },
      });
      if (emailExists) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      return {
        message: '사용 가능한 이메일입니다.',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Prisma 관련 에러 처리
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('데이터베이스 조회 중 오류가 발생했습니다.');
      }
      // ConflictException은 그대로 전달
      if (error instanceof ConflictException) {
        throw error;
      }
      // 기타 예상치 못한 에러
      throw new InternalServerErrorException('이메일 확인 중 오류가 발생했습니다.');
    }
  }

  //비밀번호 확인
  public validatePassword(password: string): string {
    if (password.length < 8) {
      throw new BadRequestException('비밀번호는 최소 8자 이상이어야 합니다.');
    }

    if (password.length > 128) {
      throw new BadRequestException('비밀번호는 최대 128자 이하여야 합니다.');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(password)) {
      throw new BadRequestException('비밀번호는 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.');
    }

    return '사용 가능한 비밀번호입니다.';
  }
}
