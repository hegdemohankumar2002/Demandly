/* ---- Types for Demandly Platform ---- */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'manufacturer' | 'admin';
  avatar?: string;
  pincode?: string;
  city?: string;
  phone?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  retailPrice: number;
  amazonPrice?: number;
  flipkartPrice?: number;
  demandCount: number;
  demandThreshold: number;
  unit: string;
  tags: string[];
}

export interface Interest {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  quantity: number;
  maxPrice: number;
  timeline: 'urgent' | '1week' | '2weeks' | '1month';
  status: 'pending' | 'threshold_met' | 'auction_active' | 'fulfilled' | 'cancelled';
  createdAt: string;
}

export interface DemandPool {
  id: string;
  product: Product;
  totalDemand: number;
  threshold: number;
  geography: string;
  pincode: string;
  deadline: string;
  status: 'aggregating' | 'threshold_met' | 'auction_active' | 'closed' | 'fulfilled';
  averageMaxPrice: number;
  bidsCount: number;
  bestBidPrice?: number;
  createdAt: string;
}

export interface Bid {
  id: string;
  manufacturerId: string;
  manufacturerName: string;
  demandPoolId: string;
  demandPool: DemandPool;
  pricePerUnit: number;
  deliveryTimeline: string;
  qualityCertifications: string[];
  status: 'submitted' | 'leading' | 'outbid' | 'won' | 'lost';
  submittedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  product: Product;
  manufacturer: {
    id: string;
    name: string;
    rating: number;
  };
  monthlyQuantity: number;
  pricePerMonth: number;
  retailPricePerMonth: number;
  status: 'active' | 'paused' | 'cancelled';
  startDate: string;
  nextDelivery: string;
  deliveriesCompleted: number;
  totalDeliveries: number;
}

export interface Order {
  id: string;
  product: Product;
  manufacturer: {
    id: string;
    name: string;
  };
  quantity: number;
  totalPrice: number;
  status: 'confirmed' | 'manufacturing' | 'shipped' | 'delivered';
  trackingId?: string;
  estimatedDelivery: string;
  orderedAt: string;
  deliveredAt?: string;
}

export interface FlashEvent {
  id: string;
  product: Product;
  targetUnits: number;
  currentUnits: number;
  pricePerUnit: number;
  retailPrice: number;
  savingsPercent: number;
  endsAt: string;
  status: 'active' | 'completed' | 'expired';
  tiers: {
    units: number;
    price: number;
    label: string;
  }[];
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  votes: number;
  totalVotes: number;
  author: {
    name: string;
    avatar?: string;
  };
  status: 'voting' | 'approved' | 'in_production' | 'completed';
  createdAt: string;
  comments: number;
}

export interface Manufacturer {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string[];
  certifications: string[];
  pincode: string;
  city: string;
  rating: number;
  totalOrders: number;
  revenue: number;
  verified: boolean;
}

export interface Notification {
  id: string;
  type: 'bid_update' | 'threshold_met' | 'auction_closing' | 'auction_closed' | 'delivery_update' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
