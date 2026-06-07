#!/usr/bin/env node
import webpush from 'web-push';

// Accept subscription JSON either as first arg or via SUB_JSON env var
let raw = process.argv[2] || process.env.SUB_JSON;
if (!raw) {
  console.error('Usage: node scripts/send-push-local.js <SUBSCRIPTION_JSON> or set SUB_JSON env var');
  process.exit(1);
}

let sub;
try {
  sub = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse subscription JSON:', e.message);
  process.exit(1);
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env to run this script');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

(async () => {
  try {
    const payload = JSON.stringify({ title: 'Test Offer', body: "Here's a test offer just for you!", url: '/offers' });
    await webpush.sendNotification(sub, payload);
    console.log('Push sent successfully');
  } catch (e) {
    console.error('Send failed', e);
  }
})();
