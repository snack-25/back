/* eslint-disable no-useless-escape */
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompaniesRequestDto } from '@src/companies/dto/companies.dto';
import { NAME_REGEX, PASSWORD_REGEX } from '@src/shared/const/RegExp';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { UserResponseDto } from './dto/response-user.dto';
import { CheckEmailRequestDto, CheckEmailResponseDto, CheckNameDto } from './dto/user.dto';
import { ReulstDto } from '@src/auth/dto/auth.dto';
import * as argon2 from 'argon2';
import { GetUserListParams, GetUserListResponse } from './dto/get-user-list-params.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
@Injectable()
export class UsersService {
  public constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ✅ 회원 목록 조회 서비스
  async getUserList(
    params: GetUserListParams & { companyId: string },
  ): Promise<GetUserListResponse> {
    const { page, limit, search, companyId } = params;

    const where = {
      companyId, // ✅ 필수: 같은 회사 소속만
      ...(search && {
        name: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
    };

    //console.log('🔥 유저 리스트 조회 조건:', where);

    const [totalCount, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true, // ✅ 프론트에서 필요하므로 꼭 포함
        },
      }),
    ]);

    // console.log('✅ 필터링된 사용자 수:', totalCount);
    // console.log(
    //   '👤 사용자 목록:',
    //   users.map(u => u.email),
    // );

    return {
      totalCount,
      users,
    };
  }

  // ✅ 권한 변경 로직
  public async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: { set: dto.role as UserRole },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  public async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      // ❌ 사용자가 없으면 예외 발생
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // ✅ 삭제 실행
      await this.prisma.user.delete({
        where: { id: userId },
      });

      // 관련 초대 상태 변경 (조건: 동일한 이메일 + PENDING 상태)
      await this.prisma.invitation.updateMany({
        where: {
          email: user.email,
          status: 'PENDING', // 아직 가입 안한 상태. 사용 안 된 초대만 만료 처리 한다.
        },
        data: {
          status: 'EXPIRED',
        },
      });
    } catch (error) {
      // ✅ Prisma 클라이언트 오류 또는 기타 에러 처리
      console.error('❌ 사용자 삭제 중 오류 발생:', error);

      // 이미 위에서 NotFoundException을 처리했으므로,
      // 그 외의 Prisma 에러는 500 처리
      throw new InternalServerErrorException('사용자 삭제에 실패했습니다.');
    }
  }

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
      throw new BadRequestException('이미 존재하는 회사입니다');
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
      throw new BadRequestException('이름은 최소 2자, 최대 50자여야 합니다');
    }
    // 영어 대소문자, 숫자, 한글만 허용 (특수문자 및 띄어쓰기는 허용하지 않음)
    if (!NAME_REGEX.test(CheckNameDto.name)) {
      throw new BadRequestException('이름에 특수문자나 띄어쓰기를 사용할 수 없습니다');
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
      throw new BadRequestException('이메일은 문자열이어야 합니다');
    }

    if (!emailRegex.test(checkEmailRequestDto.email)) {
      throw new BadRequestException('유효하지 않은 이메일 형식입니다');
    }

    try {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: checkEmailRequestDto.email },
      });
      if (emailExists) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }
      return {
        message: '사용 가능한 이메일입니다.',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Prisma 관련 에러 처리
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('데이터베이스 조회 중 오류가 발생했습니다');
      }
      // ConflictException은 그대로 전달
      if (error instanceof ConflictException) {
        throw error;
      }
      // 기타 예상치 못한 에러
      throw new InternalServerErrorException('이메일 확인 중 오류가 발생했습니다');
    }
  }

  //비밀번호 확인
  public validatePassword(password: string): string {
    if (password.length < 8) {
      throw new BadRequestException('비밀번호는 최소 8자 이상이어야 합니다');
    }

    if (password.length > 128) {
      throw new BadRequestException('비밀번호는 최대 128자 이하여야 합니다');
    }

    if (!PASSWORD_REGEX.test(password)) {
      throw new BadRequestException('비밀번호는 영문 대소문자, 숫자, 특수문자를 포함해야 합니다');
    }

    return '사용 가능한 비밀번호입니다';
  }

  // 본인 정보 조회
  public async getMe(userId: string): Promise<Pick<User, 'id' | 'email' | 'name' | 'role'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  public async getUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자 ID를 찾을 수 없습니다');
    }
    return this.toResponseDto(user);
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // 비밀번호 및 회사명 업데이트
  public async updateData(body: {
    userId: string;
    password?: string;
    company?: string;
  }): Promise<ReulstDto> {
    if (!body.userId) {
      throw new BadRequestException('잘못된 요청입니다');
    }

    const userWithCompany = await this.prisma.user.findUnique({
      where: { id: body.userId },
      include: { company: true },
    });
    if (!userWithCompany) {
      throw new BadRequestException('해당하는 사용자가 존재하지 않습니다');
    }
    if (!userWithCompany.company) {
      throw new BadRequestException('연결된 회사가 존재하지 않습니다');
    }

    if (body.password) {
      this.validatePassword(body.password);

      const hashedPassword = await argon2.hash(body.password);

      const currentData = await this.prisma.user.findUnique({
        where: { id: body.userId },
        select: { password: true, company: true },
      });
      if (!currentData) {
        throw new UnauthorizedException('유저가 없습니다');
      }

      const isSamePassword = await argon2.verify(currentData.password, body.password);

      if (isSamePassword) {
        throw new BadRequestException('전과 동일한 비밀번호는 사용할 수 없습니다');
      }

      await this.prisma.user.update({
        where: { id: body.userId },
        data: { password: hashedPassword },
        select: { id: true },
      });
    }

    if (userWithCompany.company.name === body.company) {
      return { message: '성공', company: { name: userWithCompany.company.name } };
    }
    const { name } = await this.prisma.company.update({
      where: { id: userWithCompany.company.id },
      data: { name: body.company },
      select: { name: true },
    });

    return {
      message: '성공',
      company: { name },
    };
  }

  // 기업에 있는 유저들 정보 가져오기
  public async getUsers(body: { companyId: string }): Promise<any> {
    const { companyId } = body;

    console.log('✅ Received companyId:', companyId);

    const usersResult = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    console.log('🔍 Raw usersResult:', usersResult);

    if (!usersResult) {
      return [];
    }

    const filteredUsers = usersResult.users.filter(user => user.role !== 'SUPERADMIN');

    console.log('✅ Filtered Users:', filteredUsers);

    return filteredUsers;
  }
}
