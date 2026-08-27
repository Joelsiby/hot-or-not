// Loads Checkout.js once and reuses the same promise for every caller —
// clicking upvote on multiple comments in a row shouldn't inject the
// script tag more than once.
let loadPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('client-only'));
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // let a retry try again instead of hanging on a failed load forever
      reject(new Error('Failed to load Razorpay checkout'));
    };
    document.body.appendChild(script);
  });
  return loadPromise;
}
