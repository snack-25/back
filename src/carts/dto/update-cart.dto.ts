import { ArrayNotEmpty, IsArray, IsInt, IsString, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt()
  @Min(1, { message: '수량은 최소 1 이상이어야 합니다.' })
  public quantity: number;
}

export class DeleteCartItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  public itemIds: string[];
}
