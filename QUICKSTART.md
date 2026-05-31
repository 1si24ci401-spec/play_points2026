# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Create an Account
1. Open the application
2. Click **"Get Started"** on the landing page
3. Click **"Sign up"**
4. Fill in your details:
   - Full Name: `Admin User`
   - Username: `admin`
   - Email: `admin@example.com`
   - Password: `admin123` (or any password)
5. Click **"Create Account"**

### Step 2: Add Products (Admin Only)
The first user needs admin access. To test admin features:

1. Click the **Settings** icon (⚙️) in the sidebar
2. Go to **"Products"** tab
3. Click **"Add Demo Products"** button
   - This adds 6 sample products instantly!

### Step 3: Shop!
1. Click **Shopping Bag** icon in sidebar
2. Browse products and click **"Add to Cart"**
3. Click **Shopping Cart** icon (see the count badge!)
4. Click **"Proceed to Checkout"**
5. Enter Discord username: `testuser#1234`
6. (Optional) Try coupon: Create one in Admin Dashboard first
7. Click **"Place Order"**
8. View your order in **Package** (Orders) section

---

## 🎯 Testing Admin Features

### Create a Discount Coupon
1. Go to Admin Dashboard (Settings icon)
2. Click **"Coupons"** tab
3. Click **"Create Coupon"**
4. Fill in:
   - Code: `SAVE20`
   - Discount: `20%`
   - Leave expiration empty or set a future date
5. Click **"Create Coupon"**

Now test it:
1. Add items to cart
2. Go to checkout
3. Enter `SAVE20` and click "Apply"
4. See the 20% discount applied!

### Manage Orders
1. Go to Admin Dashboard
2. Click **"Orders"** tab
3. View all customer orders
4. Change order status (Pending → Processing → Delivered)
5. Click **"Resend Email"** to simulate email confirmation

---

## 🎨 Features to Explore

### For Regular Users:
- ✅ Browse products with descriptions and pricing
- ✅ Add items to cart with quantity controls
- ✅ Cart persists across sessions
- ✅ Apply discount coupons at checkout
- ✅ View complete order history
- ✅ Real-time cart count in navigation

### For Admin Users:
- ✅ Create and manage products
- ✅ Create discount coupons with expiration
- ✅ Activate/deactivate coupons
- ✅ View all customer orders
- ✅ Update order status
- ✅ Access customer Discord usernames
- ✅ Resend order confirmations

---

## 💡 Tips

1. **Multiple Accounts**: Create both admin and regular user accounts to test different roles
2. **Cart Badge**: Watch the cart icon - it shows a live count of items!
3. **Discount Math**: The checkout page shows both original and discounted totals
4. **Order IDs**: Each order gets a unique monospace ID for easy reference
5. **Status Updates**: Admin can track orders through: Pending → Processing → Delivered → Cancelled

---

## ⚠️ Known Limitations (Demo)

- No real payment processing (no payment info collected)
- Email sending is simulated (shows toast notification only)
- Google OAuth requires additional Supabase setup
- This is a prototype - not for production use with real PII

---

## 🎉 That's It!

You now have a fully functional e-commerce platform with:
- Complete authentication system
- Product catalog
- Shopping cart with persistence
- Discount coupons
- Order management
- Admin dashboard

**Enjoy exploring the app!**
