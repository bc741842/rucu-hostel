import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
 
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
 
// BADILISHA haya matatu kabla ya kuendesha script:
const USERNAME = 'superadmin';
const PASSWORD = 'Rucu2026!';
const ROLE = 'super_admin'; // chaguo: super_admin | accountant | warden
 
async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 10);
 
  const user = await prisma.user.upsert({
    where: { username: USERNAME },
    update: {},
    create: {
      username: USERNAME,
      password: hashed,
      name: 'Msimamizi Mkuu',
      role: ROLE,
    },
  });
 
  console.log('Admin account tayari:', user.username, '| role:', user.role);
  console.log('Tumia username/password hizi kwenye POST /admin/auth/login');
}
 
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
 