import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { Company } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompanyResponseDto } from './dto/company.response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  public constructor(private readonly prismaService: PrismaService) {}

  private handleError(operation: string, id: string | null = null, error: unknown): never {
    const logger = new Logger(CompaniesService.name);
    const idString = id ? ` with id ${id}` : '';
    logger.error(
      `Failed to ${operation} company${idString}`,
      error instanceof Error ? error.stack : String(error),
    );

    if (error instanceof ConflictException || error instanceof NotFoundException) {
      throw error;
    }

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`기업 ${id}을 찾을 수 없습니다.`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('기업이 이미 존재합니다.');
      }
    }

    throw new Error(
      `회사 ${operation} 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  public async findAll(): Promise<CompanyResponseDto[]> {
    const companies = await this.prismaService.company.findMany();
    return companies.map(company => this.toResponseDto(company));
  }

  public async findUniqueOrThrow(id: string): Promise<CompanyResponseDto> {
    try {
      const company = await this.prismaService.company.findUniqueOrThrow({
        where: {
          id,
        },
      });
      return this.toResponseDto(company);
    } catch (error: unknown) {
      this.handleError('find', id, error);
    }
  }

  public async create(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    try {
      const isExistCompany = await this.prismaService.company.findFirst({
        where: {
          bizno: createCompanyDto.bizno,
        },
      });

      if (isExistCompany) {
        throw new ConflictException(
          `사업자 등록번호 ${createCompanyDto.bizno}는 이미 등록되어 있습니다.`,
        );
      }

      const company = await this.prismaService.company.create({
        data: createCompanyDto,
      });

      return this.toResponseDto(company);
    } catch (error: unknown) {
      this.handleError('create', null, error);
    }
  }

  public async delete(id: string): Promise<string> {
    try {
      // 삭제 전에 회사가 존재하는지 확인
      const company = await this.prismaService.company.findUnique({
        where: { id },
      });

      if (!company) {
        throw new NotFoundException(`기업 ${id}을 찾을 수 없습니다.`);
      }

      await this.prismaService.company.delete({
        where: { id },
      });
      return id;
    } catch (error: unknown) {
      this.handleError('delete', id, error);
    }
  }

  private toResponseDto(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      bizno: company.bizno,
      address: company.address ?? undefined,
      zipcode: company.zipcode ?? undefined,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
