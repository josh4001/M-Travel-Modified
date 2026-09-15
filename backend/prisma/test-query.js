require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing prisma.booking.findMany() with relations (vehicle, payment, review)...');
  const bookings = await prisma.booking.findMany({
    take: 5,
    include: {
      vehicle: true,
      payment: true,
      review: true,
    }
  });
  console.log('✅ Success! Found bookings count:', bookings.length);
  if (bookings.length > 0) {
    console.log('Sample booking ref:', bookings[0].bookingRef, 'Payment:', bookings[0].payment);
  }
  await prisma.$disconnect();
  console.log('🎉 Everything works with 0 errors!');
}

test().catch(err => {
  console.error('❌ Query failed:', err);
  process.exit(1);
});
