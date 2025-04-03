import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: '상품명',
    example: '허니버터칩',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  public name: string;

  @ApiProperty({
    description: '상품 설명',
    example: '달콤한 허니버터 맛이 일품인 과자',
    required: false,
  })
  @IsString()
  @IsOptional()
  public description?: string;

  @ApiProperty({
    description: '카테고리 ID',
    example: 'd8031i1djxm1hh5rpmpv2smc',
    required: true,
    enum: [
      'd8031i1djxm1hh5rpmpv2smc', // 과자
      'jvfkhtspnr4gvmtcue6xtjxf', // 봉지라면
      'si5qvq6vsqptcju91ur81w83', // 청량/탄산음료
      'az2o6o95cgxi5qsygg8c9p5h', // 차
      'h7ess07as8obzrjcad55vjs5', // 샐러드
      'bv6sxcr1a3ie7udxvpmrdpcb', // 생활용품
    ],
  })
  @IsString()
  @IsNotEmpty()
  public categoryId: string;

  @ApiProperty({
    description: '상품 가격',
    example: 1000,
    required: true,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  public price: number;

  @ApiProperty({
    description: '첨부할 상품 이미지 파일 또는 주소',
    type: 'string',
    format: 'binary',
    required: false,
  })
  public imageUrl?: Express.Multer.File | string;
}
