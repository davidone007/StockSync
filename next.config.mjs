/** @type {import('next').NextConfig} */
const nextConfig = {
	// Use Next.js static export to generate an `out` folder which `gh-pages`
	// can publish. This replaces the older `next export` CLI in recent
	// Next.js versions.
	output: "export",
};

export default nextConfig;
