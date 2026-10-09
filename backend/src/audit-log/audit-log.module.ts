import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
 
@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService], // other modules inject this to record audit entries
})
export class AuditLogModule {}
 