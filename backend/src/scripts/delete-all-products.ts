import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../db';

async function main() {
  console.log('🧹 Starting database products cleanup...');

  try {
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

    console.log(' Deleting Flash Events...');
    await prisma.flashEvent.deleteMany({});

    console.log(' Deleting Products...');
    const productDeleteResult = await prisma.product.deleteMany({});

    console.log(`✅ Successfully deleted ${productDeleteResult.count} products.`);
    console.log(' Database products cleanup finished successfully!');
  } catch (error) {
    console.error('❌ Error during database products cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
