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
 
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    BookingModule,
    PaymentModule,
    AdminAuthModule,
    HostelsModule,
    RoomsModule,
    BedsModule,
    AcademicYearsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
 