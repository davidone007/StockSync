/** @type {import('next').NextConfig} */
// Compute the basePath and assetPrefix without needing an env variable.
// We derive the repository name from the `homepage` field in package.json
// (set to https://<user>.github.io/<repo-name>) to support GitHub Pages.
import fs from "fs";
// Next.js uses Node to load next.config.mjs — `assert { type: 'json' }` is not
// always supported in older Node versions. Read package.json via fs.
const pkg = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

const homepage = pkg.homepage || "";
let repoName = "";
try {
  if (homepage) {
    const u = new URL(homepage);
    repoName = u.pathname.replace(/^\//, "").replace(/\/$/, "");
  }
} catch (e) {
  // ignore parse errors and keep repoName empty
}

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd && repoName ? `/${repoName}` : "";
const assetPrefix = isProd && repoName ? `/${repoName}/` : "";

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix,
  images: {
    // GitHub Pages does not support Next's image optimization.
    unoptimized: true,
  },
};

export default nextConfig;
