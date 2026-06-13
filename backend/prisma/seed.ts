import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const userPassword = await bcrypt.hash('test123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // --- Seed Users ---
  const u1 = await prisma.user.upsert({
    where: { email: 'aarav@example.com' },
    update: { password: userPassword },
    create: {
      id: 'u1',
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      password: userPassword,
      role: 'consumer',
      pincode: '400001',
      city: 'Mumbai',
      phone: '+91 98765 43210',
    },
  });

  const m1 = await prisma.user.upsert({
    where: { email: 'rajesh@keralanaturals.com' },
    update: { password: userPassword },
    create: {
      id: 'm1',
      name: 'Rajesh Nair',
      email: 'rajesh@keralanaturals.com',
      password: userPassword,
      role: 'manufacturer',
      companyName: 'Kerala Naturals Pvt Ltd',
      category: ['Groceries', 'Health'],
      certifications: ['FSSAI', 'Organic India'],
      pincode: '682001',
      city: 'Kochi',
      phone: '+91 94567 89012',
      rating: 4.7,
      verified: true,
    },
  });

  const a1 = await prisma.user.upsert({
    where: { email: 'admin@demandly.com' },
    update: { password: adminPassword },
    create: {
      id: 'a1',
      name: 'Platform Admin',
      email: 'admin@demandly.com',
      password: adminPassword,
      role: 'admin',
      city: 'Bangalore',
      pincode: '560001',
    },
  });

  // --- Seed Products ---
  const p1 = await prisma.product.upsert({
    where: { id: 'p1' },
    update: {},
    create: {
      id: 'p1',
      name: 'Organic Cold-Pressed Coconut Oil',
      description: 'Premium organic cold-pressed virgin coconut oil from Kerala farmers. Rich in MCTs, unrefined, and chemical-free. Perfect for cooking, skincare, and hair care.',
      category: 'Groceries',
      image: '/images/coconut-oil.jpg',
      retailPrice: 599,
      amazonPrice: 549,
      flipkartPrice: 529,
      demandCount: 234,
      demandThreshold: 300,
      unit: '1L bottle',
      tags: ['organic', 'cold-pressed', 'kerala'],
    },
  });

  const p3 = await prisma.product.upsert({
    where: { id: 'p3' },
    update: {},
    create: {
      id: 'p3',
      name: 'A2 Cow Ghee — Farm Fresh',
      description: 'Pure A2 cow ghee made from Bilona method by small dairy farms in Gujarat. No preservatives, no additives. Rich aroma and golden texture.',
      category: 'Groceries',
      image: '/images/ghee.jpg',
      retailPrice: 899,
      amazonPrice: 849,
      flipkartPrice: 829,
      demandCount: 412,
      demandThreshold: 500,
      unit: '500ml jar',
      tags: ['a2', 'bilona', 'farm-fresh'],
    },
  });

  const p4 = await prisma.product.upsert({
    where: { id: 'p4' },
    update: {},
    create: {
      id: 'p4',
      name: 'Bamboo Toothbrush Pack',
      description: 'Eco-friendly bamboo toothbrush 4-pack. Biodegradable handle with charcoal-infused bristles. Sustainable oral care for the whole family.',
      category: 'Personal Care',
      image: '/images/toothbrush.jpg',
      retailPrice: 399,
      amazonPrice: 349,
      flipkartPrice: 379,
      demandCount: 89,
      demandThreshold: 100,
      unit: 'pack of 4',
      tags: ['eco', 'bamboo', 'sustainable'],
    },
  });

  const p6 = await prisma.product.upsert({
    where: { id: 'p6' },
    update: {},
    create: {
      id: 'p6',
      name: 'Khadi Natural Soap Set',
      description: 'Handmade Khadi soaps in 6 variants — Neem, Tulsi, Lavender, Rose, Sandalwood, and Aloe Vera. Chemical-free, cold-processed, and moisturizing.',
      category: 'Personal Care',
      image: '/images/soap.jpg',
      retailPrice: 599,
      amazonPrice: 549,
      flipkartPrice: 569,
      demandCount: 321,
      demandThreshold: 400,
      unit: 'set of 6',
      tags: ['khadi', 'natural', 'handmade'],
    },
  });

  // --- Seed Demand Pools ---
  const dp1 = await prisma.demandPool.upsert({
    where: { id: 'dp1' },
    update: {},
    create: {
      id: 'dp1',
      productId: 'p1',
      totalDemand: 287,
      threshold: 300,
      geography: 'Mumbai, Maharashtra',
      pincode: '400001',
      deadline: new Date('2026-05-15T23:59:59Z'),
      status: 'auction_active',
      averageMaxPrice: 430,
      bidsCount: 5,
      bestBidPrice: 389,
    },
  });

  const dp3 = await prisma.demandPool.upsert({
    where: { id: 'dp3' },
    update: {},
    create: {
      id: 'dp3',
      productId: 'p3',
      totalDemand: 412,
      threshold: 500,
      geography: 'Ahmedabad, Gujarat',
      pincode: '380001',
      deadline: new Date('2026-05-20T23:59:59Z'),
      status: 'aggregating',
      averageMaxPrice: 680,
      bidsCount: 0,
    },
  });

  const dp4 = await prisma.demandPool.upsert({
    where: { id: 'dp4' },
    update: {},
    create: {
      id: 'dp4',
      productId: 'p4',
      totalDemand: 100,
      threshold: 100,
      geography: 'Bangalore, Karnataka',
      pincode: '560001',
      deadline: new Date('2026-05-10T23:59:59Z'),
      status: 'threshold_met',
      averageMaxPrice: 260,
      bidsCount: 3,
      bestBidPrice: 220,
    },
  });

  // --- Seed Bids ---
  await prisma.bid.upsert({
    where: { id: 'b1' },
    update: {},
    create: {
      id: 'b1',
      manufacturerId: 'm1',
      demandPoolId: 'dp1',
      pricePerUnit: 389,
      deliveryTimeline: '5-7 business days',
      qualityCertifications: ['FSSAI', 'Organic India'],
      status: 'leading',
    },
  });

  await prisma.bid.upsert({
    where: { id: 'b2' },
    update: {},
    create: {
      id: 'b2',
      manufacturerId: 'm1',
      demandPoolId: 'dp3',
      pricePerUnit: 220,
      deliveryTimeline: '3-5 business days',
      qualityCertifications: ['ISO 9001', 'FSC'],
      status: 'won',
    },
  });

  // --- Seed Flash Events ---
  await prisma.flashEvent.upsert({
    where: { id: 'fe1' },
    update: {},
    create: {
      id: 'fe1',
      productId: 'p1',
      targetUnits: 100,
      currentUnits: 67,
      pricePerUnit: 349,
      retailPrice: 599,
      savingsPercent: 42,
      endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      status: 'active',
      tiers: JSON.stringify([
        { units: 50, price: 399, label: 'Base Deal' },
        { units: 75, price: 369, label: 'Better Deal' },
        { units: 100, price: 349, label: 'Best Deal' }
      ]),
    },
  });

  await prisma.flashEvent.upsert({
    where: { id: 'fe2' },
    update: {},
    create: {
      id: 'fe2',
      productId: 'p3',
      targetUnits: 50,
      currentUnits: 23,
      pricePerUnit: 599,
      retailPrice: 899,
      savingsPercent: 33,
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      status: 'active',
      tiers: JSON.stringify([
        { units: 25, price: 699, label: 'Starter' },
        { units: 50, price: 599, label: 'Bulk Deal' }
      ]),
    },
  });

  await prisma.flashEvent.upsert({
    where: { id: 'fe3' },
    update: {},
    create: {
      id: 'fe3',
      productId: 'p6',
      targetUnits: 200,
      currentUnits: 148,
      pricePerUnit: 349,
      retailPrice: 599,
      savingsPercent: 42,
      endsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      status: 'active',
      tiers: JSON.stringify([
        { units: 100, price: 449, label: 'Group Price' },
        { units: 150, price: 399, label: 'Mega Group' },
        { units: 200, price: 349, label: 'Flash Price' }
      ]),
    },
  });

  // --- Seed Community Campaigns ---
  await prisma.campaign.upsert({
    where: { id: 'c1' },
    update: {},
    create: {
      id: 'c1',
      title: 'Organic Turmeric Powder from Local Farms',
      description: 'We want a local supply of high-quality, lab-tested organic turmeric powder — sourced directly from farmers in Erode, Tamil Nadu. No middlemen!',
      category: 'Groceries',
      votes: 72,
      totalVotes: 100,
      authorId: 'u1',
      status: 'voting',
      comments: 14,
    },
  });

  await prisma.campaign.upsert({
    where: { id: 'c2' },
    update: {},
    create: {
      id: 'c2',
      title: 'Reusable Cotton Produce Bags',
      description: 'Ditch plastic! Let\'s get affordable reusable cotton mesh bags for grocery shopping. I know a manufacturer in Coimbatore who can make them.',
      category: 'Sustainability',
      votes: 45,
      totalVotes: 80,
      authorId: 'u1',
      status: 'voting',
      comments: 8,
    },
  });

  await prisma.campaign.upsert({
    where: { id: 'c3' },
    update: {},
    create: {
      id: 'c3',
      title: 'Steel Lunch Boxes — School Edition',
      description: 'Premium stainless steel lunch boxes designed for school kids. BPA-free, leak-proof, and affordable when bought in bulk through Demandly.',
      category: 'Homeware',
      votes: 103,
      totalVotes: 100,
      authorId: 'u1',
      status: 'approved',
      comments: 22,
    },
  });

  // --- Seed Orders ---
  await prisma.order.upsert({
    where: { id: 'o1' },
    update: {
      originLat: 9.9312, originLng: 76.2673,   // Kochi (manufacturer)
      destLat: 19.0760, destLng: 72.8777,       // Mumbai (consumer)
      currentLat: 15.3173, currentLng: 75.7139, // En route — Hubli
      paymentStatus: 'paid', commissionAmount: 972.5,
    },
    create: {
      id: 'o1',
      consumerId: 'u1',
      productId: 'p1',
      manufacturerId: 'm1',
      quantity: 50,
      totalPrice: 19450,
      commissionAmount: 972.5,
      status: 'shipped',
      trackingId: 'DM-2026-0501-MUM',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      orderedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      originLat: 9.9312, originLng: 76.2673,
      destLat: 19.0760, destLng: 72.8777,
      currentLat: 15.3173, currentLng: 75.7139,
      paymentStatus: 'paid',
    },
  });

  await prisma.order.upsert({
    where: { id: 'o2' },
    update: {
      originLat: 9.9312, originLng: 76.2673,
      destLat: 12.9716, destLng: 77.5946,       // Bangalore
      paymentStatus: 'paid', commissionAmount: 2995,
    },
    create: {
      id: 'o2',
      consumerId: 'u1',
      productId: 'p3',
      manufacturerId: 'm1',
      quantity: 100,
      totalPrice: 59900,
      commissionAmount: 2995,
      status: 'manufacturing',
      estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      orderedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      originLat: 9.9312, originLng: 76.2673,
      destLat: 12.9716, destLng: 77.5946,
      paymentStatus: 'paid',
    },
  });

  await prisma.order.upsert({
    where: { id: 'o3' },
    update: {
      originLat: 9.9312, originLng: 76.2673,
      destLat: 12.9716, destLng: 77.5946,
      currentLat: 12.9716, currentLng: 77.5946,
      paymentStatus: 'paid', commissionAmount: 1100,
    },
    create: {
      id: 'o3',
      consumerId: 'u1',
      productId: 'p4',
      manufacturerId: 'm1',
      quantity: 100,
      totalPrice: 22000,
      commissionAmount: 1100,
      status: 'delivered',
      trackingId: 'DM-2026-0428-BLR',
      estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      orderedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      originLat: 9.9312, originLng: 76.2673,
      destLat: 12.9716, destLng: 77.5946,
      currentLat: 12.9716, currentLng: 77.5946,
      paymentStatus: 'paid',
    },
  });

  // --- Seed Subscriptions ---
  await prisma.subscription.upsert({
    where: { id: 's1' },
    update: {},
    create: {
      id: 's1',
      userId: 'u1',
      productId: 'p1',
      manufacturerId: 'm1',
      monthlyQuantity: 2,
      pricePerMonth: 698,
      retailPricePerMonth: 1198,
      status: 'active',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      nextDelivery: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      deliveriesCompleted: 3,
      totalDeliveries: 12,
    },
  });

  await prisma.subscription.upsert({
    where: { id: 's2' },
    update: {},
    create: {
      id: 's2',
      userId: 'u1',
      productId: 'p3',
      manufacturerId: 'm1',
      monthlyQuantity: 1,
      pricePerMonth: 599,
      retailPricePerMonth: 899,
      status: 'active',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      nextDelivery: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      deliveriesCompleted: 2,
      totalDeliveries: 12,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

