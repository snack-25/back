import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: '카테고리 ID',
    example: 'ypz39012ftfrqwqwpvi6cy6v',
  })
  public id: string;

  @ApiProperty({
    description: '카테고리 이름',
    example: '음료',
  })
  public name: string;

  @ApiProperty({
    description: '부모 카테고리 ID(부모 카테고리가 없으면 null)',
    example: null,
    nullable: true,
  })
  public parentId: string | null;
}
