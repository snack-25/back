import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product.response.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { SortOption } from './enums/sort-options.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { FILE_SIZE_LIMIT } from './const';
import { GetUser } from '@shared/decorators/get-user.decorator';
import { UserDto } from '@src/users/dto/user.dto';
import { UserRole } from '@prisma/client';
import { Role, RoleGuard } from '@src/auth/role.guard';

@ApiBearerAuth()
@Controller('products')
@UseGuards(RoleGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ProductsController {
  public constructor(private readonly productsService: ProductsService) {}

  @UseInterceptors(
    FileInterceptor('imageUrl', {
      limits: { fileSize: FILE_SIZE_LIMIT },
    }),
  )
  @ApiOperation({ summary: '상품 생성' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 200, description: '상품 생성 성공', type: ProductResponseDto })
  @Role(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post()
  public async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: UserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    return this.productsService.createProduct(user, createProductDto, file);
  }
  @ApiOperation({ summary: '내가 등록한 상품' })
  @ApiQuery({
    name: 'page',
    description: '페이지 번호',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: '페이지당 상품 수',
    type: Number,
    required: false,
    default: 8,
  })
  @ApiQuery({
    name: 'sort',
    description: '정렬 순서 (기본-최신순)',
    enum: SortOption,
    required: false,
    default: SortOption.CREATED_AT_DESC,
  })
  @Role(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('my-products')
  public async getMyProducts(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number = 8,
    @Query('sort') sort: SortOption = SortOption.CREATED_AT_DESC,
    @GetUser() user: UserDto,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productsService.getProductsByUserId({
      page,
      limit,
      sort,
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: '모든 상품 조회' })
  @ApiQuery({
    name: 'page',
    description: '페이지 번호',
    type: Number,
    required: false,
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '페이지당 상품 수',
    type: Number,
    required: false,
    default: 8,
  })
  @ApiQuery({
    name: 'search',
    description: '검색어 (상품명)',
    type: String,
    required: false,
    default: '',
  })
  @ApiQuery({
    name: 'categoryId',
    description: '카테고리 ID',
    type: String,
    required: false,
    example: '',
    enum: [
      'd8031i1djxm1hh5rpmpv2smc', // 과자
      'jvfkhtspnr4gvmtcue6xtjxf', // 봉지라면
      'si5qvq6vsqptcju91ur81w83', // 청량/탄산음료
      'az2o6o95cgxi5qsygg8c9p5h', // 차
      'h7ess07as8obzrjcad55vjs5', // 샐러드
      'bv6sxcr1a3ie7udxvpmrdpcb', // 생활용품
    ],
  })
  @ApiQuery({
    name: 'sort',
    description: `
      createdAt:asc 생성일 오름차순 (오래된 순)
      createdAt:desc 생성일 내림차순 (최신 순)
      price:asc 가격 오름차순 (낮은 가격 순)
      price:desc 가격 내림차순 (높은 가격 순)`,
    enum: SortOption,
    required: false,
    default: SortOption.CREATED_AT_DESC,
  })
  @ApiResponse({ status: 200, description: '상품 목록', type: PaginatedProductsResponseDto })
  public findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number = 8,
    @Query('search') search: string = '',
    @Query('categoryId') categoryId: string = '',
    @Query('sort') sort: SortOption = SortOption.CREATED_AT_DESC,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productsService.findAllProducts({ page, limit, search, categoryId, sort });
  }

  @Get(':id')
  @ApiOperation({ summary: '단일 상품 조회' })
  @ApiParam({ name: 'id', description: '상품 ID', example: 'ikhfu0ii0jt0e4ok8chaulpt' })
  @ApiResponse({ status: 200, description: '상품 정보', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없습니다.' })
  public async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findOneProduct(id);
  }

  @Role(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: '상품 수정' })
  @ApiParam({ name: 'id', description: '상품 ID', example: 'ikhfu0ii0jt0e4ok8chaulpt' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: '상품 수정 성공', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없습니다.' })
  public update(
    @Param('id') id: string,
    @GetUser() user: UserDto,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.updateProduct(user, id, updateProductDto);
  }

  @ApiOperation({ summary: '상품 삭제' })
  @ApiParam({ name: 'id', description: '상품 ID', example: 'ikhfu0ii0jt0e4ok8chaulpt' })
  @ApiResponse({ status: 200, description: '상품 삭제 성공' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없습니다.' })
  @Role(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Delete(':id')
  public remove(@Param('id') id: string, @GetUser() user: UserDto): Promise<string> {
    return this.productsService.deleteProduct(id, user);
  }
}
