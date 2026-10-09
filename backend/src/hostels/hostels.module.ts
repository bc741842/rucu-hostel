import { Module } from '@nestjs/common';
import { HostelsService } from './hostels.service';
import { HostelsController } from './hostels.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
 
@Module({
  imports: [AuditLogModule],
  controllers: [HostelsController],
  providers: [HostelsService],
})
export class HostelsModule {}
 