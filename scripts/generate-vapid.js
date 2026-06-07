#!/usr/bin/env node
import webpush from 'web-push';

async function main() {
  try {
    const keys = webpush.generateVAPIDKeys();
    console.log(JSON.stringify(keys, null, 2));
    console.log('\nCopy the `publicKey` into your client env as VITE_VAPID_PUBLIC_KEY');
    console.log('Copy `publicKey` and `privateKey` into your server env as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
    console.log('Set VAPID_SUBJECT (e.g. mailto:admin@example.com) for the server environment');
  } catch (e) {
    console.error('Failed to generate VAPID keys', e);
    process.exit(1);
  }
}

main();
