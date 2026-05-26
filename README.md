# Demandly — Reverse Buying Platform
> **Consumers Unite, Manufacturers Compete.** 

Demandly is a demand-driven eCommerce platform that flips the traditional supply-driven retail model on its head. Instead of manufacturers listing products and inflating prices to cover high marketing costs, consumers aggregate their demand locally. Once a demand threshold is met, manufacturers bid competitively (reverse bidding) to fulfill the consolidated order at the lowest possible price.

---

## ⚙️ Core Architecture & Concept

```mermaid
graph TD
    A[Consumer: "I want this"] -->|Aggregate by Product & Pincode| B(Demand Pool)
    B -->|Check Threshold| C{Threshold Met?}
    C -->|No| B
    C -->|Yes| D[Trigger Reverse Auction]
    D -->|Notify Manufacturers| E[Manufacturers Bid]
    E -->|Select Lowest Bid Price| F[Central Resolver]
    F -->|Generate Orders| G[Individual Consumer Orders]
    G -->|COD Confirmation| H[Local Manufacturer Fulfilment]
```

### 1. Demand Aggregation Engine
* **Interest Registration**: Consumers specify a product, required quantity, and preferred delivery timeline with a price limit.
* **Pincode-Based Clustering**: Demand is automatically grouped based on product and delivery pincodes to minimize logistical costs.
* **Threshold Promotion**: When combined quantities reach the target threshold, the platform starts a reverse auction and alerts verified manufacturers.

### 2. Reverse Auction & Bidding
* **Flexible Competitive Bidding**: Manufacturers can place bids up to the product’s retail price.
* **Real-time Feedback**: Bidders receive immediate feedback indicating if their bid is `leading` or has been `outbid`.
* **Lowest Price Wins**: Once the auction deadline passes, the system resolves the pool, selecting the lowest price bidder as the winner to generate individual consumer orders.

### 3. Annual Subscription Manager
* Consumers can lock in a 12-month supply of daily/monthly essentials (groceries, medicine, clothing) at competitive bulk-purchase prices, fulfilled iteratively by local certified producers.

---

## 🛠️ Technology Stack

* **Frontend**: [Next.js](https://nextjs.org/) (React 19, TypeScript), CSS modules (modern aesthetics, harmonized palettes, smooth transitions), Zustand (state management).
* **Backend**: Node.js + Express (TypeScript), REST APIs, Redis (for real-time auction state caching).
* **Database**: PostgreSQL (managed via Prisma ORM).
* **Test Suite**: Node.js native fetch E2E script simulating full user flows (Auth, proposals, demands, bidding, resolution, fulfilment).

---

## 📂 Directory Structure

```
├── backend/                  # REST API Server
│   ├── prisma/               # Database Schema & Migrations
│   ├── src/
│   │   ├── routes/           # API Endpoints (Admin, Consumer, Manufacturer)
│   │   ├── cron/             # Auto-closure Cron Jobs
│   │   ├── utils/            # Shared utilities (Geocoding, Auction Resolver)
│   │   └── index.ts          # Express App Entry Point
│   └── tests/                # Automated API & E2E Tests
└── demandly-app/             # Next.js Web App
    ├── public/               # Static assets
    └── src/
        ├── app/              # App Router Pages & Components
        ├── components/ui/    # Modular Visual Components
        └── stores/           # Global Client-Side States
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* PostgreSQL & Redis instances running locally or hosted.

### 1. Database Setup (Backend)
1. Navigate to the `/backend` folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file based on the local system:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<db_name>?schema=public"
   ```
3. Run migrations and seed files:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

### 2. Running the Applications
To run both backend and frontend in development mode:

* **Start Backend Server**:
  ```bash
  cd backend
  npm run dev
  ```
* **Start Frontend Dev Server**:
  ```bash
  cd demandly-app
  npm run dev
  ```

---

## 🧪 Verification & Testing
The system includes a full E2E lifecycle test suite validating the entire platform workflow.

To execute the automated API checks:
```bash
cd backend
node tests/e2e-test.mjs
```
