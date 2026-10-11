import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { HostelsModule } from './hostels/hostels.module';
import { RoomsModule } from './rooms/rooms.module';
import { BedsModule } from './beds/beds.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { WaitingListModule } from './waiting-list/waiting-list.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ChatModule } from './chat/chat.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ReportsModule } from './reports/reports.module';
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { SetupModule } from './setup/setup.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    SetupModule,
    AuthModule,
    BookingModule,
    PaymentModule,
    AdminAuthModule,
    HostelsModule,
    RoomsModule,
    BedsModule,
    AcademicYearsModule,
    WaitingListModule,
    AnnouncementsModule,
    ChatModule,
    MaintenanceModule,
    ReportsModule,
    RatingsModule,
    NotificationsModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
 