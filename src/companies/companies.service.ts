import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { Company } from '@prisma/client';
import { CompanyResponseDto } from './dto/company.response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<CompanyResponseDto[]> {
    const companies = await this.prismaService.company.findMany();
    return companies.map(company => this.toResponseDto(company));
  }

  public async findOne(id: string): Promise<CompanyResponseDto> {
    try {
      const company = await this.prismaService.company.findUniqueOrThrow({
        where: {
          id,
        },
      });
      return this.toResponseDto(company);
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`기업 ${id}을 찾을 수 없습니다.`);
    }
  }

  public async create(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const company = await this.prismaService.company.create({
      data: createCompanyDto,
    });
    return this.toResponseDto(company);
  }

  public async delete(id: string): Promise<string> {
    await this.findOne(id);

    await this.prismaService.$transaction(async tx => {
      await tx.company.delete({
        where: {
          id,
        },
      });
    });

    return id;
  }

  private toResponseDto(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      bizno: company.bizno,
      address: company.address ?? '',
      zipcode: company.zipcode ?? '',
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
