import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Guards any endpoint that is meant to be called by a logged-in STUDENT
// only (the "my ..." endpoints: my bookings, my payments, my requests,
// etc). JwtStrategy.validate() returns { studentId, regNo } for a student
// token, but { userId, role, name } for an admin/accountant/warden token -
// so on a staff token, req.user.studentId is simply undefined.
//
// Without this guard, a service method doing
//   this.prisma.booking.findMany({ where: { studentId } })
// with studentId === undefined is NOT filtering by student at all -
// Prisma treats an undefined field as "no filter", so it silently
// returns every student's rows to whichever admin/staff account called
// the "my" endpoint. This guard closes that gap by rejecting the
// request before it ever reaches the service.
@Injectable()
export class StudentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.studentId) {
      throw new ForbiddenException('This endpoint is for students only.');
    }

    return true;
  }
}
