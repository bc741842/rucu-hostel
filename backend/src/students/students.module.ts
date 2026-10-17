import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [AuditLogModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
