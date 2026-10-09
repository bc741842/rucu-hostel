import { Module } from '@nestjs/common';
import { BedsService } from './beds.service';
import { BedsController } from './beds.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
 
@Module({
  imports: [AuditLogModule],
  controllers: [BedsController],
  providers: [BedsService],
})
export class BedsModule {}
 