import { z } from 'zod';

export const createBidSchema = z.object({
  demandPoolId: z.string().min(1, 'demandPoolId is required'),
  pricePerUnit: z.number().positive('pricePerUnit must be a positive number'),
  deliveryTimeline: z.union([z.number().positive(), z.string()]).optional(),
});

export const proposeProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  proposedPrice: z.coerce.number().positive('proposedPrice must be a positive number'),
  unit: z.string().min(1, 'Unit is required'),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
});

export const registerInterestSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  maxPrice: z.number().positive('maxPrice must be a positive number'),
  timeline: z.string().optional(),
});

export const createPaymentOrderSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
});

export const approveVerificationSchema = z.object({
  id: z.string().min(1, 'Invalid manufacturer ID'),
});

export const updateDemandPoolStatusParamsSchema = z.object({
  id: z.string().min(1, 'Invalid demand pool ID'),
});

export const updateDemandPoolStatusBodySchema = z.object({
  status: z.enum(['aggregating', 'threshold_met', 'auction_active', 'fulfilled', 'closed']),
});

export const updateSettingsSchema = z.object({
  commissionPercent: z.number().positive('commissionPercent must be positive').optional(),
  auctionDurationHours: z.number().int().positive('auctionDurationHours must be a positive integer').optional(),
  platformName: z.string().optional(),
  currency: z.string().optional(),
  region: z.string().optional(),
  defaultThreshold: z.number().int().positive().optional(),
  autoCloseNoActivityHrs: z.number().int().positive().optional(),
  flashEventMinUnits: z.number().int().positive().optional(),
  campaignVoteGoal: z.number().int().positive().optional(),
  emailNewRegistrations: z.boolean().optional(),
  emailThresholdMet: z.boolean().optional(),
  emailDailyDigest: z.boolean().optional(),
  emailNewDemandPools: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  twoFactorForAdmins: z.boolean().optional(),
  autoLockAfterAttempts: z.number().int().positive().optional(),
});
