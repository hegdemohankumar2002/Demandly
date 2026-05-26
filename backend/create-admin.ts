import { prisma } from './src/db';
import bcrypt from 'bcryptjs';

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demandly.com' },
    update: {
      password: hashedPassword,
      role: 'admin',
      verified: true
    },
    create: {
      name: 'Platform Admin',
      email: 'admin@demandly.com',
      password: hashedPassword,
      role: 'admin',
      verified: true
    }
  });
  
  console.log('✅ Admin user ensured in database:', admin.email);
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
