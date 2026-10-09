import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
 
@Module({
  imports: [AuditLogModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
 