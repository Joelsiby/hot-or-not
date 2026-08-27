import type { NextConfig } from "next"

// React dev mode needs eval() for its debugging features (stack traces
// across module boundaries, Fast Refresh) — it never uses eval() in a
// production build, so 'unsafe-eval' only needs to apply locally.
const scriptSrc = process.env.NODE_ENV === "development"
	? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cloud.umami.is https://*.polar.sh https://vercel.live"
	: "script-src 'self' 'unsafe-inline' https://cloud.umami.is https://*.polar.sh https://vercel.live"

const securityHeaders = [
	{ key: "Content-Security-Policy", value: `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss://ws-us3.pusher.com; frame-src 'self' https://*.polar.sh https://vercel.live; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://*.polar.sh` },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
]

const nextConfig: NextConfig = {
	async headers() {
		return [{ source: "/(.*)", headers: securityHeaders }]
	},
}

export default nextConfig
