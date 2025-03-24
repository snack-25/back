import { Controller, Get, Param, Body, Post, Delete } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CompanyResponseDto } from './dto/company.response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('companies')
export class CompaniesController {
  public constructor(private readonly companiesService: CompaniesService) {}

  @ApiOperation({ summary: '기업 목록 조회' })
  @ApiResponse({ status: 200, description: '기업 목록', type: CompanyResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: '기업 목록 조회 실패' })
  @Get('')
  public async findAllCompanies(): Promise<CompanyResponseDto[]> {
    return this.companiesService.findAll();
  }

  @ApiOperation({ summary: '기업 정보 조회' })
  @ApiParam({ name: 'id', description: '기업 ID', example: 'pqitr9luxsiblob165ayet8w' })
  @ApiResponse({ status: 200, description: '기업 정보', type: CompanyResponseDto })
  @ApiResponse({ status: 404, description: '기업을 찾을 수 없습니다.' })
  @Get(':id')
  public async findCompanyById(@Param('id') id: string): Promise<CompanyResponseDto> {
    return this.companiesService.findUniqueOrThrow(id);
  }

  @ApiOperation({ summary: '기업 생성' })
  @ApiBody({
    type: CreateCompanyDto,
  })
  @ApiResponse({ status: 200, description: '기업 생성 성공', type: CompanyResponseDto })
  @ApiResponse({ status: 400, description: '기업 생성 실패' })
  @Post('')
  public async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.create(createCompanyDto);
  }

  @ApiOperation({ summary: '기업 삭제' })
  @ApiParam({ name: 'id', description: '기업 ID' })
  @ApiResponse({ status: 200, description: '기업 삭제 성공' })
  @ApiResponse({ status: 404, description: '기업을 찾을 수 없습니다.' })
  @ApiResponse({ status: 400, description: '기업 삭제 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @Delete(':id')
  public async deleteCompanyById(@Param('id') id: string): Promise<string> {
    return this.companiesService.delete(id);
  }
}
