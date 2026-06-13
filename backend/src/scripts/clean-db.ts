import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../db';

async function main() {
  console.log('🧹 Starting database cleanup...');

  try {
    // 1. Find all users to delete (all except admin@demandly.com)
    const usersToDelete = await prisma.user.findMany({
      where: {
        NOT: {
          email: 'admin@demandly.com'
        }
      },
      select: {
        id: true,
        email: true
      }
    });

    const userIds = usersToDelete.map(u => u.id);
    console.log(`Found ${userIds.length} test user account(s) to remove.`);

    if (userIds.length === 0) {
      console.log(' No test accounts to delete. Database is already clean.');
      return;
    }

    // 2. Delete all related records in correct dependency order to prevent FK violations
    console.log(' Deleting Subscriptions...');
    await prisma.subscription.deleteMany({});

    console.log(' Deleting Orders...');
    await prisma.order.deleteMany({});

    console.log(' Deleting Bids...');
    await prisma.bid.deleteMany({});

    console.log(' Deleting Demand Pools...');
    await prisma.demandPool.deleteMany({});

    console.log(' Deleting Interests...');
    await prisma.interest.deleteMany({});

    console.log(' Deleting Campaigns...');
    await prisma.campaign.deleteMany({});

    console.log(' Deleting Product Proposals...');
    await prisma.productProposal.deleteMany({});

    console.log(' Deleting Notifications...');
    await prisma.notification.deleteMany({});

    console.log(' Deleting Products...');
    await prisma.product.deleteMany({});

    console.log(' Deleting OTP codes...');
    await prisma.verificationOtp.deleteMany({});

    // 3. Delete user accounts
    console.log(' Deleting test User records...');
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });

    console.log(`✅ Successfully deleted ${deleteResult.count} test users.`);
    console.log(' Database cleanup finished successfully!');
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
