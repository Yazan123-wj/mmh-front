import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    authInterrupts: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/category/gaming-pcs", destination: "/shop", permanent: false },
      { source: "/category/custom-pcs", destination: "/shop", permanent: false },
      { source: "/category/laptops", destination: "/shop", permanent: false },
      { source: "/category/playstation-5", destination: "/category/playstation", permanent: false },
      { source: "/category/playstation-controllers", destination: "/category/playstation", permanent: false },
      { source: "/category/playstation-accessories", destination: "/category/playstation", permanent: false },
      { source: "/category/pc-components", destination: "/shop", permanent: false },
      { source: "/category/graphics-cards", destination: "/shop", permanent: false },
      { source: "/category/processors", destination: "/shop", permanent: false },
      { source: "/category/motherboards", destination: "/shop", permanent: false },
      { source: "/category/ram", destination: "/shop", permanent: false },
      { source: "/category/ssd-storage", destination: "/shop", permanent: false },
      { source: "/category/monitors", destination: "/shop", permanent: false },
      { source: "/category/gaming-gear", destination: "/shop", permanent: false },
      { source: "/category/gaming-mice", destination: "/shop", permanent: false },
      { source: "/category/gaming-keyboards", destination: "/shop", permanent: false },
      { source: "/category/headsets", destination: "/shop", permanent: false },
      { source: "/category/microphones", destination: "/shop", permanent: false },
      { source: "/category/gaming-chairs", destination: "/shop", permanent: false },
      { source: "/category/streaming-equipment", destination: "/shop", permanent: false },
      { source: "/category/cables-accessories", destination: "/shop", permanent: false },
      { source: "/digital-cards", destination: "/game-top-ups", permanent: false },
      { source: "/shipping-returns", destination: "/digital-product-policy", permanent: false },
    ];
  },
};

export default nextConfig;
