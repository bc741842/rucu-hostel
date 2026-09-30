import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
 
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
 
const HOSTELS = [
  { name: 'NKEMBO', genderAllowed: 'male' },
  { name: 'KATIKAZA', genderAllowed: 'male' },
  { name: 'KAMUZOLA', genderAllowed: 'female' },
  { name: 'ST ELIZABETH', genderAllowed: 'female' },
];
 
// Badilisha bei hizi kama chuo kina bei tofauti kwa kila aina ya chumba.
// pricePerStudent ni kiasi ANACHOLIPA MWANAFUNZI MMOJA kwa mwaka (si bei ya chumba kizima).
const FLOORS = [
  { code: 'G', floorNumber: 1, capacity: 4, roomsCount: 30, pricePerStudent: 300000 }, // ghorofa ya chini
  { code: 'M', floorNumber: 2, capacity: 3, roomsCount: 30, pricePerStudent: 400000 }, // ghorofa ya kati
  { code: 'T', floorNumber: 3, capacity: 2, roomsCount: 30, pricePerStudent: 550000 }, // ghorofa ya juu
];
 
const BED_LABELS = ['A', 'B', 'C', 'D'];
 
async function main() {
  // Safisha data ya zamani ya majaribio (hosteli/vyumba/vitanda) kabla ya kuunda mpya,
  // ili kuepuka kurudufu. Haigusi wanafunzi, bookings, au malipo yaliyopo.
  console.log('Kusafisha data ya zamani ya hosteli/vyumba/vitanda...');
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.hostel.deleteMany({});
 
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2026/2027' },
    update: {},
    create: {
      name: '2026/2027',
      startsAt: new Date('2026-09-01'),
      endsAt: new Date('2027-06-30'),
      status: 'active',
    },
  });
  console.log('Academic year:', academicYear.id);
 
  for (const hostelData of HOSTELS) {
    const hostel = await prisma.hostel.create({
      data: {
        name: hostelData.name,
        genderAllowed: hostelData.genderAllowed,
        location: 'RUCU Campus',
      },
    });
    console.log(`\nHostel created: ${hostel.name} (${hostel.id})`);
 
    for (const floor of FLOORS) {
      for (let i = 1; i <= floor.roomsCount; i++) {
        const roomNumber = `${hostelData.name}-${floor.code}-${String(i).padStart(2, '0')}`;
 
        const room = await prisma.room.create({
          data: {
            hostelId: hostel.id,
            number: roomNumber,
            floor: floor.floorNumber,
            price: floor.pricePerStudent,
          },
        });
 
        const bedsData = Array.from({ length: floor.capacity }, (_, idx) => ({
          roomId: room.id,
          number: `${roomNumber}-${BED_LABELS[idx]}`,
          status: 'free',
        }));
 
        await prisma.bed.createMany({ data: bedsData });
      }
      console.log(`  Floor ${floor.floorNumber} (${floor.capacity}-bed rooms): ${floor.roomsCount} rooms done.`);
    }
  }
 
  const totalRooms = HOSTELS.length * FLOORS.reduce((sum, f) => sum + f.roomsCount, 0);
  const totalBeds = HOSTELS.length * FLOORS.reduce((sum, f) => sum + f.roomsCount * f.capacity, 0);
 
  console.log(`\nSeed imekamilika: hostels=${HOSTELS.length}, rooms=${totalRooms}, beds=${totalBeds}`);
}
 
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
 