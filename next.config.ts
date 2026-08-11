import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nới lỏng thời gian build trang lên 300 giây (5 phút)
  staticPageGenerationTimeout: 300,
};

export default nextConfig;