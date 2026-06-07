import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import webpush from 'npm:web-push';
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS — restrict to known origins only, not wildcard
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://pdgcxaalgtlvtkgykywp.supabase.co',
];

app.use(
  "/*",
  cors({
    origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: false,
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

// List users (admin only) - helper for admin UI (returns KV user entries)
app.get('/make-server-549f93eb/users', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const userProfile = await kv.get(`user:${user.id}`);
  if (userProfile?.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

  try {
    const users = await kv.getByPrefix('user:');
    return c.json({ users: users || [] });
  } catch (e) {
    console.log('Users list error', e);
    return c.json({ error: 'Failed to list users' }, 500);
  }
});

// Store notification events
app.post('/make-server-549f93eb/notification-event', async (c) => {
  try {
    const body = await c.req.json();
    const { type, userId } = body;
    const key = `notification_event:${Date.now()}-${Math.random().toString(36).substr(2,8)}`;
    await kv.set(key, { ...body, receivedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    console.log('Notification event store error:', error);
    return c.json({ error: 'Failed to store notification event' }, 500);
  }
});

// Get recent notification events (admin only)
app.get('/make-server-549f93eb/notification-events', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const userProfile = await kv.get(`user:${user.id}`);
  if (userProfile?.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

  try {
    const events = await kv.getByPrefix('notification_event:');
    // return most recent first
    const sorted = (events || []).sort((a: any, b: any) => new Date(b.value?.receivedAt || b.receivedAt || 0).getTime() - new Date(a.value?.receivedAt || a.receivedAt || 0).getTime());
    // normalize shape
    const normalized = sorted.map((e: any) => e.value || e);
    return c.json({ events: normalized });
  } catch (e) {
    console.log('Notification events list error', e);
    return c.json({ error: 'Failed to list notification events' }, 500);
  }
});

// Preview personalized message for a single user (admin only)
app.get('/make-server-549f93eb/preview-personalized', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const userProfile = await kv.get(`user:${user.id}`);
  if (userProfile?.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

  try {
    const targetUserId = c.req.query('userId');
    if (!targetUserId) return c.json({ error: 'userId query param required' }, 400);

    const targetProfile = await kv.get(`user:${targetUserId}`);
    if (!targetProfile) return c.json({ error: 'Target user not found' }, 404);

    // Build personalization similar to send-push-personalized
    const allOrders = await kv.getByPrefix('order:');
    const userOrders = (allOrders || []).filter((o: any) => o.userId === targetUserId);

    let title = 'New Offers for you';
    let body = 'Check today\'s exclusive offers.';
    let url = '/offers';

    if (userOrders && userOrders.length > 0) {
      userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const last = userOrders[0];
      const topItem = last.items && last.items.length ? (last.items[0].name || last.items[0].title || JSON.stringify(last.items[0])) : null;
      if (topItem) {
        body = `Hi ${targetProfile.fullName || targetProfile.email || 'there'}, new offers on ${topItem} — grab them now!`;
      } else {
        body = `Hi ${targetProfile.fullName || targetProfile.email || 'there'}, we've curated new offers based on your orders.`;
      }
    }

    return c.json({ title, body, url });
  } catch (error) {
    console.log('Preview personalized error:', error);
    return c.json({ error: 'Failed to preview personalization' }, 500);
  }
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

// Store push subscription for authenticated user
app.post('/make-server-549f93eb/subscriptions', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { subscription } = await c.req.json();
    if (!subscription) return c.json({ error: 'Subscription required' }, 400);

    // store under key push_subscription:{userId}
    await kv.set(`push_subscription:${user.id}`, { subscription, createdAt: new Date().toISOString() });

    return c.json({ success: true });
  } catch (error) {
    console.log('Subscription store error:', error);
    return c.json({ error: 'Failed to store subscription' }, 500);
  }
});

// Store FCM registration token for authenticated user
app.post('/make-server-549f93eb/fcm-token', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ error: 'FCM token required' }, 400);

    // Store under key fcm_token:{userId}
    await kv.set(`fcm_token:${user.id}`, { token, createdAt: new Date().toISOString() });
    console.log(`[FCM] Token saved for user ${user.id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('FCM token store error:', error);
    return c.json({ error: 'Failed to store FCM token' }, 500);
  }
});

// ─── FCM Helpers ─────────────────────────────────────────────────────────────

/** Build a signed JWT and exchange it for a Google OAuth2 access token (for FCM v1 API) */
async function getGoogleAccessToken(clientEmail: string, privateKeyRaw: string): Promise<string> {
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    sub: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const signingInput = `${enc(header)}.${enc(claim)}`;

  // Strip PEM headers and decode
  const keyBody = privateKey
    .replace(/-----BEGIN RSA PRIVATE KEY-----|-----END RSA PRIVATE KEY-----|-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(keyBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const jwt = `${signingInput}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Google OAuth failed: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

/** Send one FCM notification to a single device token via FCM HTTP v1 API */
async function sendFCMToToken(
  fcmToken: string,
  payload: { title: string; body: string; url?: string; userId?: string | null },
  projectId: string,
  accessToken: string
): Promise<void> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title: payload.title, body: payload.body },
          webpush: {
            fcm_options: { link: payload.url || '/' },
            data: { url: payload.url || '/', userId: payload.userId || '' },
          },
        },
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    console.log(`[FCM] Send failed for token (${fcmToken.slice(0, 20)}...): ${errText}`);
  }
}

// ─── Unified push dispatcher ──────────────────────────────────────────────────

/** Send a push notification using the configured provider (FCM or WebPush). */
async function sendPushNotification(payload: {
  title: string;
  body: string;
  url: string;
  userId?: string | null;
  broadcast?: boolean;
}) {
  const PUSH_PROVIDER = Deno.env.get('PUSH_PROVIDER') || 'webpush';

  // ── FCM ──────────────────────────────────────────────────────────────────
  if (PUSH_PROVIDER === 'fcm') {
    const FCM_PROJECT_ID   = Deno.env.get('FCM_PROJECT_ID');
    const FCM_CLIENT_EMAIL = Deno.env.get('FCM_CLIENT_EMAIL');
    const FCM_PRIVATE_KEY  = Deno.env.get('FCM_PRIVATE_KEY');

    const isMock =
      !FCM_PROJECT_ID ||
      !FCM_CLIENT_EMAIL ||
      !FCM_PRIVATE_KEY ||
      FCM_PROJECT_ID === 'mock-firebase-project';

    if (isMock) {
      console.log('[Mock FCM] Push triggered:', payload);
      const key = `notification_event:${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      await kv.set(key, {
        type: 'delivered',
        userId: payload.userId || 'all-users',
        title: payload.title,
        body: payload.body,
        url: payload.url,
        provider: 'fcm_mock',
        receivedAt: new Date().toISOString(),
      });
      return { success: true, simulated: true };
    }

    // Get OAuth2 access token once
    const accessToken = await getGoogleAccessToken(FCM_CLIENT_EMAIL!, FCM_PRIVATE_KEY!);

    if (payload.broadcast) {
      // Send to every stored FCM token
      const allTokens = await kv.getByPrefix('fcm_token:');
      let sent = 0;
      for (const item of allTokens || []) {
        try {
          const uid = item.key?.split(':')[1] || null;
          const token = item.token || item.value?.token;
          if (!token) continue;
          await sendFCMToToken(token, { ...payload, userId: uid }, FCM_PROJECT_ID!, accessToken);
          sent++;
        } catch (e) {
          console.log('[FCM] Failed to send to one token', e);
        }
      }
      return { success: true, sent };
    } else if (payload.userId) {
      const entry = await kv.get(`fcm_token:${payload.userId}`);
      const token = entry?.token || entry?.value?.token;
      if (!token) return { success: false, error: 'No FCM token registered for this user' };
      await sendFCMToToken(token, payload, FCM_PROJECT_ID!, accessToken);
      return { success: true, sent: 1 };
    }
    return { success: false, error: 'No target specified for FCM notification' };
  }

  // ── Native Web Push (VAPID) ───────────────────────────────────────────────
  const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';
  const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY');
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured');
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  if (payload.broadcast) {
    const subscriptions = await kv.getByPrefix('push_subscription:');
    let sent = 0;
    for (const item of subscriptions || []) {
      try {
        const uid = item.key?.split(':')[1] || null;
        const sub = item.value?.subscription || item.subscription;
        if (!sub) continue;
        await webpush.sendNotification(sub, JSON.stringify({ ...payload, userId: uid }));
        sent++;
      } catch (e) {
        console.log('[WebPush] Failed to send to one subscription', e);
      }
    }
    return { success: true, sent };
  } else if (payload.userId) {
    const subEntry = await kv.get(`push_subscription:${payload.userId}`);
    const subscription = subEntry?.subscription || subEntry?.value?.subscription;
    if (!subscription) return { success: false, error: 'No web-push subscription for user' };
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true, sent: 1 };
  }
  return { success: false, error: 'Invalid payload type' };
}


// Send push to all saved subscriptions (admin only) - can be called by a scheduler
app.post('/make-server-549f93eb/send-push', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const userProfile = await kv.get(`user:${user.id}`);
  if (userProfile?.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

  try {
    const payloadInput = await c.req.json().catch(() => ({ title: 'Daily Offers', body: 'Check today\'s offers on PlayPoints!', url: '/offers' }));
    
    let targetUserId = payloadInput.userId;
    if (payloadInput.email) {
      const users = await kv.getByPrefix('user:');
      const targetUser = (users || []).find((u: any) => 
        (u.email?.toLowerCase() === payloadInput.email.toLowerCase()) || 
        (u.value?.email?.toLowerCase() === payloadInput.email.toLowerCase())
      );
      if (targetUser) {
        targetUserId = targetUser.id || targetUser.value?.id || targetUser.key?.split(':')[1];
      } else {
        return c.json({ error: 'User with specified email not found' }, 404);
      }
    }

    if (targetUserId) {
      const result = await sendPushNotification({ ...payloadInput, userId: targetUserId, broadcast: false });
      return c.json({ success: true, ...result });
    } else {
      const result = await sendPushNotification({ ...payloadInput, broadcast: true });
      return c.json({ success: true, ...result });
    }
  } catch (error: any) {
    console.log('Send push error:', error);
    return c.json({ error: error.message || 'Failed to send pushes' }, 500);
  }
});

// Admin-triggered personalized push to users based on past orders
app.post('/make-server-549f93eb/send-push-personalized', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const userProfile = await kv.get(`user:${user.id}`);
  if (userProfile?.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

  try {
    const payloadOverrides = await c.req.json().catch(() => ({}));
    const users = await kv.getByPrefix('user:');
    let sent = 0;

    for (const u of users || []) {
      try {
        const uid = u.id || u.value?.id || u.key?.split(':')[1];
        if (!uid) continue;

        const allOrders = await kv.getByPrefix('order:');
        const userOrders = (allOrders || []).filter((o: any) => o.userId === uid);

        let title = payloadOverrides.title || 'New Offers for you';
        let body = payloadOverrides.body || 'Check today\'s exclusive offers.';
        let url = payloadOverrides.url || '/offers';

        if (userOrders && userOrders.length > 0) {
          userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const last = userOrders[0];
          const topItem = last.items && last.items.length ? (last.items[0].name || last.items[0].title || JSON.stringify(last.items[0])) : null;
          if (topItem) {
            body = `Hi ${u.fullName || u.email || 'there'}, new offers on ${topItem} — grab them now!`;
          } else {
            body = `Hi ${u.fullName || u.email || 'there'}, we've curated new offers based on your orders.`;
          }
        }

        const res = await sendPushNotification({ title, body, url, userId: uid });
        if (res.success) {
          sent++;
        }
      } catch (e) {
        console.log('Failed to send personalized push to user', e);
      }
    }

    return c.json({ success: true, sent });
  } catch (error: any) {
    console.log('Personalized send push error:', error);
    return c.json({ error: error.message || 'Failed to send personalized pushes' }, 500);
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

// Update order status (admin can update any, owner can update if pending)
app.put("/make-server-549f93eb/orders/:orderId", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);
    const orderId = c.req.param('orderId');
    const updates = await c.req.json();

    const existing = await kv.get(orderId);

    if (!existing) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const isAdmin = userProfile?.role === 'admin';
    const isOwner = existing.userId === user.id;

    if (!isAdmin && !isOwner) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

      // Owners can only edit within 1 minute of order creation and while it's still pending
      if (!isAdmin) {
        const createdAt = new Date(existing.createdAt).getTime();
        const now = Date.now();
        const ONE_MIN = 1 * 60 * 1000;

        if (now - createdAt > ONE_MIN) {
          return c.json({ error: 'Edit window expired (1 minute)' }, 400);
        }

        if (existing.status !== 'pending') {
          return c.json({ error: 'Cannot update order after it has been processed' }, 400);
        }
      }

    // Recalculate remaining amount if they are changing partial payment, paid amount, etc.
    const totalForCalc = updates.discountedTotal !== undefined ? updates.discountedTotal : existing.discountedTotal;
    const pType = updates.paymentType !== undefined ? updates.paymentType : existing.paymentType;
    const pAmt = updates.partialAmount !== undefined ? Number(updates.partialAmount) : Number(existing.partialAmount || 0);

    const remainingAmount = pType === 'partial' 
      ? (totalForCalc - pAmt) 
      : 0;

    const orderData = {
      ...existing,
      ...updates,
      remainingAmount,
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

    // Normal users can only cancel within 1 minute of order creation
    const userProfile = await kv.get(`user:${user.id}`);
    const isAdmin = userProfile?.role === 'admin';
    if (!isAdmin) {
      const createdAt = new Date(existing.createdAt).getTime();
      const now = Date.now();
      const ONE_MIN = 1 * 60 * 1000;
      if (now - createdAt > ONE_MIN) {
        return c.json({ error: 'Cancellation window expired (1 minute)' }, 400);
      }
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

// ============ NOTIFICATION ENDPOINTS ============

// Send notification to a specific user (admin only)
app.post("/make-server-549f93eb/users/:userId/notify", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const { message } = await c.req.json();

    if (!message || !message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const key = `notifications:${userId}`;
    const notifications = await kv.get(key) || [];
    notifications.push({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      read: false
    });

    await kv.set(key, notifications);

    return c.json({ success: true });
  } catch (error) {
    console.log('Send notification error:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// Get user notifications (authenticated user)
app.get("/make-server-549f93eb/notifications", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const key = `notifications:${user.id}`;
    const notifications = await kv.get(key) || [];
    const unread = notifications.filter((n: any) => !n.read);
    return c.json({ notifications: unread });
  } catch (error) {
    console.log('Get notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Mark notification as read (authenticated user)
app.post("/make-server-549f93eb/notifications/:notificationId/read", async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const notificationId = c.req.param('notificationId');
    const key = `notifications:${user.id}`;
    const notifications = await kv.get(key) || [];

    const updated = notifications.map((n: any) => {
      if (n.id === notificationId) {
        return { ...n, read: true };
      }
      return n;
    });

    await kv.set(key, updated);
    return c.json({ success: true });
  } catch (error) {
    console.log('Mark notification read error:', error);
    return c.json({ error: 'Failed to update notification' }, 500);
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
