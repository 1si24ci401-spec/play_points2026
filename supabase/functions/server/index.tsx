import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to get authenticated user
const getAuthenticatedUser = async (authHeader: string | null) => {
  if (!authHeader) {
    return null;
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }

  return user;
};

// Health check endpoint
app.get("/make-server-549f93eb/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ AUTH ENDPOINTS ============

// Sign up endpoint
app.post("/make-server-549f93eb/signup", async (c) => {
  try {
    const { email, password, fullName, username, role: requestedRole } = await c.req.json();

    // Automatically assign admin role to specific email
    const role = email === 'hydrabus45@gmail.com' ? 'admin' : (requestedRole || 'user');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        username,
        role
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      fullName,
      username,
      role,
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Get user profile
app.get("/make-server-549f93eb/profile", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    let profile = await kv.get(`user:${user.id}`);

    // If profile doesn't exist, create it (for OAuth users)
    if (!profile) {
      const isAdmin = user.email === 'hydrabus45@gmail.com';
      const role = isAdmin ? 'admin' : 'user';

      profile = {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0],
        username: user.email?.split('@')[0],
        role,
        createdAt: new Date().toISOString()
      };

      await kv.set(`user:${user.id}`, profile);
    } else if (user.email === 'hydrabus45@gmail.com' && profile.role !== 'admin') {
      // Upgrade to admin if it's the special email
      profile.role = 'admin';
      await kv.set(`user:${user.id}`, profile);
    }

    return c.json({ user: profile });
  } catch (error) {
    console.log('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// ============ PRODUCT ENDPOINTS ============

// Get all products
app.get("/make-server-549f93eb/products", async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products: products || [] });
  } catch (error) {
    console.log('Products fetch error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Create product (admin only)
app.post("/make-server-549f93eb/products", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const product = await c.req.json();
    const productId = `product:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const productData = {
      id: productId,
      ...product,
      createdAt: new Date().toISOString()
    };

    await kv.set(productId, productData);

    return c.json({ success: true, product: productData });
  } catch (error) {
    console.log('Product creation error:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

// Update product (admin only)
app.put("/make-server-549f93eb/products/:productId", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { productId } = c.req.param();
    const existing = await kv.get(productId);

    if (!existing) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const updates = await c.req.json();
    const productData = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(productId, productData);

    return c.json({ success: true, product: productData });
  } catch (error) {
    console.log('Product update error:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// Delete product (admin only)
app.delete("/make-server-549f93eb/products/:productId", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { productId } = c.req.param();

    await kv.del(productId);

    return c.json({ success: true });
  } catch (error) {
    console.log('Product deletion error:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// ============ CART ENDPOINTS ============

// Get user's cart
app.get("/make-server-549f93eb/cart", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    return c.json({ cart });
  } catch (error) {
    console.log('Cart fetch error:', error);
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

// Update user's cart
app.post("/make-server-549f93eb/cart", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { items } = await c.req.json();
    await kv.set(`cart:${user.id}`, { items, updatedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    console.log('Cart update error:', error);
    return c.json({ error: 'Failed to update cart' }, 500);
  }
});

// ============ COUPON ENDPOINTS ============

// Get all coupons (admin only)
app.get("/make-server-549f93eb/coupons", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const coupons = await kv.getByPrefix('coupon:');
    return c.json({ coupons: coupons || [] });
  } catch (error) {
    console.log('Coupons fetch error:', error);
    return c.json({ error: 'Failed to fetch coupons' }, 500);
  }
});

// Validate coupon code
app.post("/make-server-549f93eb/coupons/validate", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { code } = await c.req.json();

    if (!code) {
      return c.json({ error: 'Coupon code required' }, 400);
    }

    const coupon = await kv.get(`coupon:${code.toUpperCase()}`);

    if (!coupon) {
      return c.json({ valid: false, error: 'Invalid coupon code' });
    }

    if (!coupon.active) {
      return c.json({ valid: false, error: 'Coupon is inactive' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return c.json({ valid: false, error: 'Coupon has expired' });
    }

    // Check if user has already used this coupon
    const usageKey = `coupon_usage:${code.toUpperCase()}:${user.id}`;
    const alreadyUsed = await kv.get(usageKey);

    if (alreadyUsed) {
      return c.json({ valid: false, error: 'You have already used this coupon' });
    }

    return c.json({ valid: true, coupon });
  } catch (error) {
    console.log('Coupon validation error:', error);
    return c.json({ error: 'Failed to validate coupon' }, 500);
  }
});

// Create coupon (admin only)
app.post("/make-server-549f93eb/coupons", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { code, discountPercent, active, expiresAt } = await c.req.json();

    const couponData = {
      code: code.toUpperCase(),
      discountPercent,
      active: active ?? true,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    await kv.set(`coupon:${code.toUpperCase()}`, couponData);

    return c.json({ success: true, coupon: couponData });
  } catch (error) {
    console.log('Coupon creation error:', error);
    return c.json({ error: 'Failed to create coupon' }, 500);
  }
});

// Update coupon (admin only)
app.put("/make-server-549f93eb/coupons/:code", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const code = c.req.param('code').toUpperCase();
    const updates = await c.req.json();

    const existing = await kv.get(`coupon:${code}`);

    if (!existing) {
      return c.json({ error: 'Coupon not found' }, 404);
    }

    const couponData = {
      ...existing,
      ...updates,
      code,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`coupon:${code}`, couponData);

    return c.json({ success: true, coupon: couponData });
  } catch (error) {
    console.log('Coupon update error:', error);
    return c.json({ error: 'Failed to update coupon' }, 500);
  }
});

// Delete coupon (admin only)
app.delete("/make-server-549f93eb/coupons/:code", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const code = c.req.param('code').toUpperCase();
    await kv.del(`coupon:${code}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Coupon deletion error:', error);
    return c.json({ error: 'Failed to delete coupon' }, 500);
  }
});

// ============ OFFERS ENDPOINTS ============

// Get all offers (public)
app.get("/make-server-549f93eb/offers", async (c) => {
  try {
    const offers = await kv.get('offers');

    // Return default offers if none exist
    if (!offers || !offers.data) {
      return c.json({
        offers: [
          {
            id: '1',
            title: 'Limited Time Offer',
            description: 'Get exclusive access to our premium digital products with special discounts',
            discount: '50%',
          },
          {
            id: '2',
            title: 'Bundle Deal',
            description: 'Purchase multiple products and save even more on your order',
            discount: '30%',
          },
          {
            id: '3',
            title: 'First Purchase',
            description: 'New customers get a special welcome discount on their first order',
            discount: '20%',
          },
        ]
      });
    }

    return c.json({ offers: offers.data });
  } catch (error) {
    console.log('Offers fetch error:', error);
    return c.json({ error: 'Failed to fetch offers' }, 500);
  }
});

// Update offers (admin only)
app.post("/make-server-549f93eb/offers", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { offers } = await c.req.json();

    await kv.set('offers', {
      data: offers,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    });

    return c.json({ success: true, offers });
  } catch (error) {
    console.log('Offers update error:', error);
    return c.json({ error: 'Failed to update offers' }, 500);
  }
});

// ============ ORDER ENDPOINTS ============

// Create order
app.post("/make-server-549f93eb/orders", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { items, total, discountedTotal, couponCode, discordUsername, codGameId, paymentType, partialAmount } = await c.req.json();

    // Enforce: one coupon per order, one-time use per user
    if (couponCode) {
      const normalizedCode = String(couponCode).toUpperCase();
      const coupon = await kv.get(`coupon:${normalizedCode}`);
      if (!coupon) {
        return c.json({ error: 'Invalid coupon code' }, 400);
      }
      if (!coupon.active) {
        return c.json({ error: 'Coupon is inactive' }, 400);
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return c.json({ error: 'Coupon has expired' }, 400);
      }
      const usageKey = `coupon_usage:${normalizedCode}:${user.id}`;
      const alreadyUsed = await kv.get(usageKey);
      if (alreadyUsed) {
        return c.json({ error: 'You have already used this coupon' }, 400);
      }
    }

    const orderId = `order:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const userProfile = await kv.get(`user:${user.id}`);

    const orderData = {
      id: orderId,
      userId: user.id,
      userEmail: user.email,
      discordUsername,
      codGameId,
      items,
      total,
      discountedTotal,
      couponCode,
      paymentType: paymentType || 'full', // 'full' or 'partial'
      partialAmount: partialAmount || 0,
      remainingAmount: paymentType === 'partial' ? (discountedTotal - (partialAmount || 0)) : 0,
      paymentStatus: 'pending', // 'pending', 'approved', 'rejected'
      status: 'pending', // 'pending', 'processing', 'completed', 'cancelled'
      createdAt: new Date().toISOString()
    };

    await kv.set(orderId, orderData);

    // Mark coupon as used by this user (one-time use, not refunded on cancellation)
    if (couponCode) {
      const usageKey = `coupon_usage:${String(couponCode).toUpperCase()}:${user.id}`;
      await kv.set(usageKey, {
        orderId,
        usedAt: new Date().toISOString()
      });
    }

    // Clear user's cart
    await kv.set(`cart:${user.id}`, { items: [] });

    return c.json({ success: true, order: orderData });
  } catch (error) {
    console.log('Order creation error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get user's orders
app.get("/make-server-549f93eb/orders", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    // If admin, get all orders
    if (userProfile?.role === 'admin') {
      const orders = await kv.getByPrefix('order:');
      return c.json({ orders: orders || [] });
    }

    // Otherwise, get only user's orders
    const allOrders = await kv.getByPrefix('order:');
    const userOrders = allOrders.filter((order: any) => order.userId === user.id);
    return c.json({ orders: userOrders || [] });
  } catch (error) {
    console.log('Orders fetch error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Update order status (admin only)
app.put("/make-server-549f93eb/orders/:orderId", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orderId = c.req.param('orderId');
    const updates = await c.req.json();

    const existing = await kv.get(orderId);

    if (!existing) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const orderData = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(orderId, orderData);

    return c.json({ success: true, order: orderData });
  } catch (error) {
    console.log('Order update error:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Cancel order (user can cancel their own orders)
app.post("/make-server-549f93eb/orders/:orderId/cancel", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const orderId = c.req.param('orderId');
    const existing = await kv.get(orderId);

    if (!existing) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Check if user owns this order
    if (existing.userId !== user.id) {
      return c.json({ error: 'You can only cancel your own orders' }, 403);
    }

    // Check if order can be cancelled
    if (existing.status === 'completed' || existing.status === 'delivered') {
      return c.json({ error: 'Cannot cancel completed orders' }, 400);
    }

    if (existing.status === 'cancelled') {
      return c.json({ error: 'Order is already cancelled' }, 400);
    }

    // Users cannot cancel orders that are being processed by admin
    if (existing.status === 'processing') {
      return c.json({ error: 'Cannot cancel orders that are already being processed by admin' }, 400);
    }

    const orderData = {
      ...existing,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(orderId, orderData);

    return c.json({ success: true, order: orderData });
  } catch (error) {
    console.log('Order cancellation error:', error);
    return c.json({ error: 'Failed to cancel order' }, 500);
  }
});

// Resend order confirmation email (admin only - placeholder)
app.post("/make-server-549f93eb/orders/:orderId/resend-email", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orderId = c.req.param('orderId');
    const order = await kv.get(orderId);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // In a real application, this would send an email
    // For this demo, we'll just log it and return success
    console.log(`Would resend confirmation email for order ${orderId} to ${order.userEmail}`);

    return c.json({ success: true, message: 'Email resent successfully' });
  } catch (error) {
    console.log('Email resend error:', error);
    return c.json({ error: 'Failed to resend email' }, 500);
  }
});

// ============ OFFERS ENDPOINTS ============

// Get all offers
app.get("/make-server-549f93eb/offers", async (c) => {
  try {
    const offers = await kv.getByPrefix('offer:');
    return c.json({ offers: offers || [] });
  } catch (error) {
    console.log('Offers fetch error:', error);
    return c.json({ error: 'Failed to fetch offers' }, 500);
  }
});

// Create offer (admin only)
app.post("/make-server-549f93eb/offers", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const offer = await c.req.json();
    const offerId = `offer:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const offerData = {
      id: offerId,
      ...offer,
      createdAt: new Date().toISOString()
    };

    await kv.set(offerId, offerData);

    return c.json({ success: true, offer: offerData });
  } catch (error) {
    console.log('Offer creation error:', error);
    return c.json({ error: 'Failed to create offer' }, 500);
  }
});

// Update offer (admin only)
app.put("/make-server-549f93eb/offers/:offerId", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const offerId = c.req.param('offerId');
    const updates = await c.req.json();

    const existing = await kv.get(offerId);

    if (!existing) {
      return c.json({ error: 'Offer not found' }, 404);
    }

    const offerData = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(offerId, offerData);

    return c.json({ success: true, offer: offerData });
  } catch (error) {
    console.log('Offer update error:', error);
    return c.json({ error: 'Failed to update offer' }, 500);
  }
});

// Delete offer (admin only)
app.delete("/make-server-549f93eb/offers/:offerId", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const offerId = c.req.param('offerId');
    await kv.del(offerId);

    return c.json({ success: true });
  } catch (error) {
    console.log('Offer deletion error:', error);
    return c.json({ error: 'Failed to delete offer' }, 500);
  }
});

Deno.serve(app.fetch);
