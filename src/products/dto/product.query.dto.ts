import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SortOption } from '../enums/sort-options.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsCuid2 } from '@shared/decorators/is-cuid2.decorator';

export class ProductQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  public page: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 상품 수',
    default: 8,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  public limit: number = 8;

  @ApiPropertyOptional({
    description: '검색어 (상품명)',
  })
  @IsOptional()
  @IsString()
  public search: string;

  @ApiPropertyOptional({
    description: '카테고리 ID',
  })
  @IsOptional()
  @IsString()
  public categoryId: string = '';

  @ApiPropertyOptional({
    description: '정렬 순서 (기본-최신순)',
    enum: SortOption,
    default: SortOption.CREATED_AT_DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOption, { message: 'Invalid sort option' })
  public sort: SortOption = SortOption.CREATED_AT_DESC;
}

export class MyProductQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  public page: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 상품 수',
    default: 8,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  public limit: number = 8;

  @ApiPropertyOptional({
    description: '정렬 순서 (기본-최신순)',
    enum: SortOption,
    default: SortOption.CREATED_AT_DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOption, { message: 'Invalid sort option' })
  public sort: SortOption = SortOption.CREATED_AT_DESC;

  @IsCuid2()
  @IsNotEmpty()
  public userId: string;
}
