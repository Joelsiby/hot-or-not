import type { NextConfig } from "next"

// React dev mode needs eval() for its debugging features (stack traces
// across module boundaries, Fast Refresh) — it never uses eval() in a
// production build, so 'unsafe-eval' only needs to apply locally.
//
// 'unsafe-inline' has to stay in BOTH modes: Next.js's App Router injects
// its own RSC/hydration payload as inline <script>self.__next_f.push(...)
// tags on every page, in production too. Stripping 'unsafe-inline' from
// production blocks those scripts, which means React never hydrates —
// the page still renders (SSR HTML), it just becomes completely inert:
// no buttons, no client-side fetches, nothing. That's exactly what "local
// works, live doesn't" was — dev mode's CSP still had 'unsafe-inline',
// production's didn't. Tightening this properly means switching to a
// nonce-based CSP (a middleware.ts generating a per-request nonce that
// Next automatically applies to its own inline scripts) — worth doing
// later, but 'unsafe-inline' is the correct default until that's in.
const scriptSrc = process.env.NODE_ENV === "development"
	? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cloud.umami.is https://*.polar.sh https://vercel.live https://checkout.razorpay.com"
	: "script-src 'self' 'unsafe-inline' https://cloud.umami.is https://*.polar.sh https://vercel.live https://checkout.razorpay.com"

const securityHeaders = [
	{ key: "Content-Security-Policy", value: `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss://ws-us3.pusher.com; frame-src 'self' https://*.polar.sh https://vercel.live https://api.razorpay.com https://checkout.razorpay.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://*.polar.sh` },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "X-XSS-Protection", value: "1; mode=block" },
	{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
]

const nextConfig: NextConfig = {
	async headers() {
		return [{ source: "/(.*)", headers: securityHeaders }]
	},
}

export default nextConfig
