/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    experimental: {
        optimizePackageImports: [
            "@nextui-org/react",
            "lucide-react",
            "firebase",
            "date-fns",
            "lodash"
        ],
    },
};

export default nextConfig;
