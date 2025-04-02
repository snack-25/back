import { Module } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, PrismaService],
})
export class InvitationsModule {}
