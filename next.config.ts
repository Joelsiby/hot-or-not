import type { NextConfig } from "next"

const securityHeaders = [
	{ key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cloud.umami.is https://*.polar.sh; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' https://*.polar.sh; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://*.polar.sh" },
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
