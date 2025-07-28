# EZ Customers – Music Industry CRM Platform

**EZ Customers** is a comprehensive, role-based customer relationship management (CRM) platform purpose-built for the music industry.

## 🧩 App Overview

EZ Customers connects three key user types in the music production ecosystem:

- **Producers** – Offer audio services, manage bookings, handle payments, and deliver files.
- **Clients** – Discover and book producers, pay via Stripe (with split payment options), and access final deliverables.
- **Advocates** – Refer new users and earn commissions based on a tiered system.

The app is a centralized hub to streamline the **entire music production workflow** — from first contact to payment and delivery — with role-specific features and isolated data access.

## 👥 User Roles and Dashboards

### 🔧 Producers
- Manage studio bookings (calendar/scheduler)
- Maintain client relationships
- Upload and lock/unlock project files based on invoice status
- View activity and job analytics

### 🎧 Clients
- Discover producer services
- Book sessions
- Pay upfront or in parts using split payments (via Stripe)
- Access completed deliverables once payment is complete

### 💼 Advocates
- Refer clients/producers via referral links
- Earn commissions through a tiered structure:
  - **Bronze** – 10%
  - **Silver** – 18%
  - **Gold** – 25%
- Track referrals and earnings via dashboard

## 💸 Payment Workflow

- Integrated with **Stripe**
- Split payments:
  - Partial deposit upfront
  - Remaining balance paid to unlock files
- Payment confirmation triggers file unlock and producer payout

## 📦 Key Features

- **File Management System**: Files can be uploaded with **locking** tied to invoice status.
- **Real-Time Notifications**: Events for bookings, payments, file availability.
- **Analytics Dashboards**: Role-specific data visualizations (e.g., earnings, conversion rates).
- **Strict Permission Control**: Data isolation between producers, clients, and advocates.
- **Role Switching**: Users can hold multiple roles under a single email login.

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Express.js + Node.js
- **Auth**: Supabase (Google OAuth planned)
- **Database**: Supabase Postgres (with RLS)
- **Payments**: Stripe
- **Hosting**: Vercel (frontend), Render/Fly.io (backend)

## 🔄 Core Workflow

1. **Client** discovers a producer and requests a booking.
2. **Producer** accepts the booking; invoice is generated via Stripe.
3. **Client** pays deposit (optional), session starts.
4. **Producer** uploads files — locked if unpaid.
5. **Client** completes payment → files unlock automatically.
6. **Advocate** (if involved) earns commission from transaction.

## ⚠️ Notes for AI Tools (Cursor, etc.)

- File access is **gated by payment status** and **role**.
- Advocate tracking is based on **referral code attribution**.

---

