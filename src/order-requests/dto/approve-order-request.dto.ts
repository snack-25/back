import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsCuid2 } from 'src/shared/decorators/is-cuid2.decorator'; // 저희는 CUID2를 사용하고 있어서 UUID 대신 CUID2 용 Decorator를 적용했습니다

export class ApproveOrderRequestDto {
  @ApiProperty({ description: '주문 요청을 승인한 관리자 ID', example: 'p9ri9lsfyxy4k4juq9nw2jpa' })
  @IsCuid2()
  public resolverId: string;

  @ApiProperty({ description: '승인 메시지', example: '요청이 승인되었습니다.' })
  @IsString()
  public notes: string;
}
