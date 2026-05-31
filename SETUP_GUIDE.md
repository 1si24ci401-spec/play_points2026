# Secure Points System - Setup Guide

## Overview

A comprehensive e-commerce platform for digital products with Supabase authentication, Discord integration, and full admin capabilities.

## Features Implemented

### 1. Landing Page ✅
- Beautiful welcome page with animated design
- Feature highlights (Secure Transactions, Instant Delivery, Premium Quality)
- "Get Started" button leading to authentication

### 2. Authentication System ✅
- **Email/Password Registration**: Full name, username, email, and password
- **Email/Password Login**: Secure authentication via Supabase
- **Google OAuth**: Direct sign-in with Google account (requires Supabase configuration)
- **Role-Based Access**: User and Admin roles with different permissions

### 3. Shopping Experience ✅
- **Product Catalog**: Browse digital products with descriptions and pricing
- **Shopping Cart**: 
  - Add/remove products
  - Adjust quantities
  - Cart persists across sessions (stored in Supabase database)
  - Real-time cart count badge in navigation

### 4. Checkout Process ✅
- **Discord Username Field**: Required for product delivery
- **Discount Coupon System**: 
  - Apply coupon codes at checkout
  - Real-time validation
  - Percentage-based discounts
  - Visual discount calculation
- **Order Summary**: Complete breakdown of items and totals

### 5. Admin Dashboard ✅
- **Product Management**:
  - Create new products with name, description, price, and category
  - View all products
  - Quick demo data seeding option
  
- **Coupon Management**:
  - Create discount coupons with custom codes
  - Set discount percentage (1-100%)
  - Activate/deactivate coupons
  - Optional expiration dates
  - Delete coupons
  
- **Order Management**:
  - View all customer orders
  - See order details, items, and totals
  - Track applied discount coupons
  - View customer email and Discord username
  - Update order status (Pending → Processing → Delivered → Cancelled)
  - Resend confirmation emails (placeholder functionality)

### 6. User Features ✅
- **Order History**: View all past orders with full details
- **Profile Management**: Session persistence and automatic re-authentication

### 7. Database Integration (Supabase) ✅
- User accounts with profiles
- Product catalog
- Shopping cart persistence
- Order history with complete details
- Discount coupons management
- Secure authentication tokens

## Getting Started

### Prerequisites
1. Supabase project connected (already done ✅)
2. All dependencies installed (already done ✅)

### First-Time Setup

1. **Create an Admin Account**:
   - Click "Get Started" on the landing page
   - Click "Sign up"
   - Fill in your details (any email/password for demo)
   - You'll be logged in as a regular user

2. **Upgrade to Admin** (for testing):
   - The first user can be manually set as admin in the Supabase backend
   - Or create a new account and use the backend to set `role: 'admin'` in the user profile

3. **Add Demo Products**:
   - Go to Admin Dashboard (Settings icon in sidebar)
   - Navigate to "Products" tab
   - Click "Add Demo Products" to seed 6 sample products
   - Or manually add products using "Add Product" button

4. **Create Discount Coupons** (Optional):
   - Go to Admin Dashboard → Coupons tab
   - Click "Create Coupon"
   - Example: Code "SAVE20" for 20% off

5. **Test the Flow**:
   - Sign out and create a regular user account
   - Browse products and add to cart
   - Proceed to checkout
   - Apply a coupon code
   - Enter Discord username
   - Complete the order
   - View order history

## Google OAuth Setup (Optional)

To enable Google OAuth sign-in:

1. Follow the guide at: https://supabase.com/docs/guides/auth/social-login/auth-google
2. Configure Google OAuth in your Supabase dashboard
3. Add authorized redirect URLs
4. The "Continue with Google" button will work automatically once configured

## Architecture

### Frontend (React + TypeScript)
- **Router**: React Router v7 with data mode
- **Design System**: @figma/astraui (Astra UI kit)
- **State Management**: React Context (Auth + Cart)
- **Notifications**: Sonner toast library
- **Animations**: Motion (Framer Motion)

### Backend (Supabase Edge Functions)
- **Server**: Hono web framework on Deno
- **Database**: Supabase KV store (key-value pairs)
- **Authentication**: Supabase Auth with JWT tokens
- **API Routes**: RESTful endpoints for all operations

### Key Endpoints

**Auth**:
- `POST /signup` - Create new user
- `GET /profile` - Get user profile

**Products**:
- `GET /products` - Get all products
- `POST /products` - Create product (admin only)

**Cart**:
- `GET /cart` - Get user's cart
- `POST /cart` - Update cart

**Coupons**:
- `GET /coupons` - Get all coupons (admin only)
- `POST /coupons/validate` - Validate coupon code
- `POST /coupons` - Create coupon (admin only)
- `PUT /coupons/:code` - Update coupon (admin only)
- `DELETE /coupons/:code` - Delete coupon (admin only)

**Orders**:
- `GET /orders` - Get orders (user's or all if admin)
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update order status (admin only)
- `POST /orders/:id/resend-email` - Resend confirmation (admin only)

## Design System

This project uses the **Astra UI Design System** with:
- **Color Palette**: Dark mode support, lavender canvas (`brand-tertiary`), minimal brand color usage
- **Typography**: Clean hierarchy with design system tokens
- **Spacing**: Base-4 system (4px, 8px, 12px, 16px, 24px)
- **Components**: Button, InputField, SelectField, Badge, Avatar, Navigation, and more
- **Corner Radius**: Rounded corners (8px default, 16px for cards)

## Navigation Structure

1. **SidebarNavigation** (Primary):
   - Home (Landing page)
   - Shopping Bag (Products)
   - Shopping Cart (with item count badge)
   - Package (Orders)
   - Settings (Admin only)
   - Logout
   - User Avatar

## Security Notes

⚠️ **Important**: This is a demo/prototype application built with Figma Make. It is NOT intended for production use with real user data or payment processing.

- User passwords are hashed by Supabase Auth
- JWT tokens are used for API authentication
- Admin routes are protected server-side
- All API calls include proper error handling
- CORS is configured for the frontend

## Troubleshooting

### Products not showing:
1. Make sure you're logged in
2. Go to Admin Dashboard and add demo products
3. Or manually create products via the Products tab

### Cart not persisting:
- Cart data is saved to Supabase when logged in
- Make sure you have an active session

### Coupon not working:
- Check that coupon is active in Admin Dashboard
- Verify expiration date hasn't passed
- Coupon codes are case-insensitive

### Google OAuth not working:
- This requires additional setup in Supabase dashboard
- Follow the setup guide: https://supabase.com/docs/guides/auth/social-login/auth-google
- The app will show an error message if Google OAuth isn't configured

## Future Enhancements (Not Implemented)

Some features mentioned in the spec but out of scope for this prototype:
- Actual email sending (placeholder function exists)
- Real payment processing (no payment info collected)
- PDF invoice generation
- Partial/deposit payment system
- Real-time analytics dashboard
- Image uploads for products
- Advanced filtering and search

## Support

This application was built as a comprehensive demo of a secure e-commerce platform. All core features are functional and ready for testing!
