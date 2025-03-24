import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { Company } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompanyResponseDto } from './dto/company.response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  public constructor(private readonly prismaService: PrismaService) {}

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
      const logger = new Logger(CompaniesService.name);
      logger.error(`Failed to find company with id ${id}`, (error as Error)?.stack);
      if ((error as PrismaClientKnownRequestError)?.code === 'P2025') {
        throw new NotFoundException(`기업 ${id}을 찾을 수 없습니다.`);
      }
      throw error;
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

      const company = await this.prismaService.$transaction(async tx => {
        return tx.company.create({
          data: createCompanyDto,
        });
      });

      return this.toResponseDto(company);
    } catch (error: unknown) {
      const logger = new Logger(CompaniesService.name);
      logger.error(`Failed to create company`, (error as Error)?.stack);

      if ((error as PrismaClientKnownRequestError)?.code === 'P2002') {
        throw new ConflictException('기업이 이미 존재합니다.');
      }

      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`회사 생성 중 오류가 발생했습니다: ${(error as Error)?.message}`);
    }
  }

  public async delete(id: string): Promise<string> {
    try {
      await this.prismaService.$transaction(async tx => {
        await tx.company.delete({
          where: { id },
        });
      });
      return id;
    } catch (error: unknown) {
      const logger = new Logger(CompaniesService.name);
      logger.error(`Failed to delete company with id ${id}`, (error as Error)?.stack);
      if ((error as PrismaClientKnownRequestError)?.code === 'P2025') {
        throw new NotFoundException(`기업 ${id}을 찾을 수 없습니다.`);
      }
      throw error;
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
