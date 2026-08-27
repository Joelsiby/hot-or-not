import Razorpay from 'razorpay';

// Server-side Razorpay client — creates orders. Verifying a payment's
// signature after checkout (app/api/razorpay/verify/route.ts) uses
// RAZORPAY_KEY_SECRET directly via Node's crypto, not this client.
// Never import this from a Client Component — the secret must not reach
// the browser.
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
