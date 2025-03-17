import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: '카테고리 ID',
    example: 'sub-쿠키',
  })
  public id: string;

  @ApiProperty({
    description: '카테고리 이름',
    example: '쿠키',
  })
  public name: string;

  @ApiProperty({
    description: '부모 카테고리 ID(부모 카테고리가 없으면 null)',
    example: 'cat-스낵',
    nullable: true,
  })
  public parentId: string | null;
}
