import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Credentials now come from environment variables instead of being
// hardcoded in source (hardcoded secrets end up in git history forever,
// even if you later change them). Set these in your .env file, or pass
// them inline on the command line, before running this script:
//
//   ADMIN_USERNAME=superadmin ADMIN_PASSWORD=YourNewPassword123! npx ts-node prisma/create-admin.ts
//
// ADMIN_ROLE is optional and defaults to "super_admin" (choices:
// super_admin | accountant | warden).
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;
const ROLE = process.env.ADMIN_ROLE || 'super_admin';

async function main() {
  if (!USERNAME || !PASSWORD) {
    console.error(
      'Missing ADMIN_USERNAME and/or ADMIN_PASSWORD environment variables.\n' +
        'Example:\n' +
        '  ADMIN_USERNAME=superadmin ADMIN_PASSWORD=YourNewPassword123! npx ts-node prisma/create-admin.ts',
    );
    process.exit(1);
  }

  if (PASSWORD.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(PASSWORD, 10);

  // update: re-running with the same username rotates the password/role -
  // handy for resetting a forgotten admin password without touching the
  // database by hand.
  const user = await prisma.user.upsert({
    where: { username: USERNAME },
    update: { password: hashed, role: ROLE },
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
