// Every paid action (an upvote) costs a fixed base price — there's no
// auction/bidding here, just "pay the base price to push a comment up."
export const BASE_PRICE_PAISE = 2000; // ₹20

export function formatINR(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
