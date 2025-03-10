import { Controller } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  public constructor(private readonly invitationsService: InvitationsService) {}

  //TODO: /invitations (POST) 초대 메일 발송(초대 생성)
  //TODO: /invitations/{invitationId} (GET) 초대장 상태 조회
}
