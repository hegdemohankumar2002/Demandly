import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './db';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true
    }
  });
  console.log('--- REGISTERED USERS ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
