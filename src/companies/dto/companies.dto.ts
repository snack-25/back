import { ApiProperty, PickType } from '@nestjs/swagger';
import { createId } from '@paralleldrive/cuid2';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CompaniesDto {
  @ApiProperty({
    nullable: false,
    description: '회사 ID (CUID 자동 생성)',
    example: createId(),
    type: String,
  })
  // 회사 ID는 CUID로 자동 생성되므로, 사용자가 직접 입력할 필요가 없음
  public id: string;

  @ApiProperty({
    nullable: false,
    description: '회사명(최소 1자, 최대 50자 문자열)',
    example: '가나다마트',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  public name: string;

  @ApiProperty({
    nullable: false,
    description: '사업자번호(10자 - 빼고)',
    example: 1234567890,
    type: String,
  })
  public bizno: string;
}

export class CompaniesRequestDto extends PickType(CompaniesDto, ['name', 'bizno']) {}
export class CompaniesResponseDto extends PickType(CompaniesDto, ['id']) {}
