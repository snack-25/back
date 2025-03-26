import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  GenerateTokenResponseDto,
  InvitationCreateRequestDto,
  InvitationCreateResponseDto,
} from './dto/invitation.dto';
import { Invitation } from './interfaces/invitation.interface';
import { InvitationsService } from './invitations.service';
import { Token } from './types/token.type';

@Controller('invitations')
export class InvitationsController {
  public constructor(private readonly invitationsService: InvitationsService) {}

  // 초대 메일 발송 시나리오
  // 1. 최고관리자가 회원관리 페이지에서 회원초대하기 버튼을 눌러 회원초대 모달을 연다.
  // 2. 회원초대 모달에서 초대할 이름, 이메일, 권한을 입력한다.
  // 3. 등록하기 버튼을 눌러 초대 메일을 발송한다.
  // 4. 초대 메일을 받은 유저가 메일 내 회원가입 링크를 클릭하면 회원가입 페이지로 이동한다.
  // 4-1. 초대 메일을 받은 유저가 24시간 이후 회원가입 링크를 클릭하면
  // 5. 이 때 회원가입 페이지에는 토큰을 통해 이름과 이메일이 미리 입력되어 있고 readonly로 수정이 불가능하다.
  // 6. 회원가입 페이지에서 유저는 비밀번호, 비밀번호 확인을 입력한다.
  // 7. 회원가입 버튼을 눌러 회원가입을 완료한다.(이 때 초대에서 회원의 상태는 PENDING -> ACCEPTED로 변경된다.)
  // 8. 회원가입 완료 후 최고관리자가 회원관리 페이지에서 초대 목록을 확인할 수 있다.

  // @Get('generate-id')
  // public generateId(@Query('quantity') quantity?: number): string[] {
  //   return this.invitationsService.generateId(quantity);
  // }

  @Get('generate-token')
  @ApiOperation({ summary: '초대 토큰 생성' })
  @ApiResponse({ status: 200, description: '초대 토큰 생성 성공', type: GenerateTokenResponseDto })
  public generateToken(): GenerateTokenResponseDto {
    return this.invitationsService.generateToken();
  }

  @Get('hash-token')
  // http GET http://localhost:4000/api/invitations/hash-token?email=${email}&token=${token}
  public hashToken(@Query('email') email: string, @Query('token') token: string): Token {
    return this.invitationsService.hashToken(email, token);
  }

  //TODO: /invitations (POST) 초대 생성(초대 메일 발송)
  @Post()
  @ApiOperation({ summary: '초대 생성(초대 메일 발송)' })
  @ApiResponse({
    status: 200,
    description: '초대 생성 성공(초대 메일 발송)',
    type: InvitationCreateRequestDto,
  })
  // http POST http://localhost:4000/api/invitations id=736a2a51eff6fa0c3ceefad53c1ede2a4533c803b6c7db7cc331c80158ed3592
  public async createInvitation(
    @Body() dto: InvitationCreateRequestDto,
  ): Promise<InvitationCreateResponseDto> {
    return this.invitationsService.createInvitation(dto);
  }

  // //TODO: /invitations (POST) 초대 메일 발송(초대 생성)
  // @Post()
  // @ApiOperation({ summary: '초대 메일 발송(초대 생성)' })
  // @ApiResponse({
  //   status: 200,
  //   description: '초대 메일 발송 성공',
  //   type: InvitationCreateResponseDto,
  // })
  // public async sendEmail(@Body() body: { id: string }): Promise<void> {
  //   return this.invitationsService.sendInvitationEmail(body.id);
  // }

  //TODO: /invitations/{invitationId} (GET) 초대 ID로 초대장 상태 조회
  @Get(':invitationId')
  @ApiOperation({ summary: '초대 ID로 초대장 상태 조회' })
  @ApiResponse({
    status: 200,
    description: '초대 ID로 초대장 상태 조회 성공',
  })
  public async getInvitationById(@Param('invitationId') invitationId: string): Promise<Invitation> {
    return this.invitationsService.getInvitationById(invitationId);
  }

  //TODO: /invitations/{token} (GET) 토큰으로 초대장 상태 조회
  @Get(':token')
  @ApiOperation({ summary: '토큰으로 초대장 상태 조회' })
  @ApiResponse({
    status: 200,
    description: '토큰으로 초대장 상태 조회 성공',
  })
  public async getInvitationByToken(@Param('token') token: string): Promise<Invitation> {
    return this.invitationsService.getInvitationByToken(token);
  }
}
