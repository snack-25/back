import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import {
  SignUpComponeyRequestDto,
  SignUpRequestDto,
  SignInRequestDto,
  SigninResponseDto,
  SignUpResponseDto,
} from './dto/auth.dto';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  public constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  public async signup(dto: SignUpRequestDto): Promise<SignUpResponseDto> {
    // 회원가입 로직
    const { email, password, name, company, bizno } = dto;

    //이름 확인 (길이제한, 특문, 띄어쓰기)
    await this.usersService.checkName({ name: name });
    // 이메일 중복 확인
    await this.usersService.checkEmail({ email: email }); // 중복 메세지
    //회사 사업자 확인
    await this.usersService.checkCompany({ name: company, bizno: bizno });

    const companyIdCheck: { id: string; msg: string } = await this.companyCreate({
      company,
      bizno,
    });

    //비밀번호 확인
    this.usersService.validatePassword(password);

    //비밀번호 해시화
    interface IArgon2 {
      hash(data: string, options?: argon2.Options): Promise<string>;
    }
    const safeArgon2 = argon2 as unknown as IArgon2;
    const hashedPassword: string = await safeArgon2.hash(password);

    //트랜직션에 넣을거
    const superAdmin = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyId: companyIdCheck.id,
        role: 'SUPERADMIN', // 최고 관리자 권한 할당
      },
    });

    const response: SignUpResponseDto = {
      email: superAdmin.email,
      name: superAdmin.name,
      company: company, // 회사명은 dto에서 받아온 회사명을 그대로 사용
      companyId: companyIdCheck.id, // companyId는 companyCreate 메서드에서 받아온 값
      role: superAdmin.role, // role은 superAdmin 객체에서 가져옴
    };

    return response;
  }

  public async companyCreate(dto: SignUpComponeyRequestDto): Promise<{ id: string; msg: string }> {
    try {
      const { company, bizno } = dto;
      const companyId = await this.prisma.company.create({
        data: {
          name: company,
          bizno,
        },
        select: {
          id: true,
        },
      });
      return { msg: '성공', id: companyId.id };
    } catch (err) {
      const result = { msg: '', id: '' };
      if (err.code === 'P2002') {
        result.msg = '회사가 있습니다.';
      }
      return result;
    }
  }

  public async login(dto: SignInRequestDto): Promise<SigninResponseDto | undefined> {
    try {
      // console.warn(dto);
      // console.log('너가 나오는거냐?', dto);
      const { email, password } = dto;
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      // console.log('너가 user?', user);
      if (!user) {
        return undefined;
      }
      // 입력된 비밀번호와 데이터베이스에 저장된 비밀번호 해시 비교
      const isPasswordValid = await argon2.verify(user.password, password);

      // 비밀번호가 유효하지 않으면 에러 발생
      if (!isPasswordValid) {
        throw new BadRequestException('이메일 또는 비밀번호가 잘못되었습니다.');
      }
      // return await Promise.resolve(user);
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
}
