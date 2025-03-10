import { ConflictException, Injectable } from '@nestjs/common';
import { SignUpRequestDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  public constructor(private usersService: UsersService) {}

  /**
   * [최고관리자] 회원가입
   * @param {SignUpRequestDto} dto
   * @return {*}  {Promise<void>}
   * @memberof AuthService
   */
  public async signup(dto: SignUpRequestDto): Promise<void> {
    // 회원가입 로직
    try {
      await this.usersService.checkEmail({ email: dto.email });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(`회원가입에 실패했습니다.`);
      }
    }
  }
}
