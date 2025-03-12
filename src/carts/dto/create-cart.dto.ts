import { IsString } from 'class-validator';

export class CreateCartDto {
  @IsString()
  public readonly productId: string;
}
