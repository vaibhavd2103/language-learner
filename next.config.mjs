/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundling `ws` breaks its optional native helper ("bufferUtil.mask is not a function"); load these from node_modules instead.
  serverExternalPackages: ["msedge-tts", "ws", "isomorphic-ws", "bufferutil", "utf-8-validate"],
};
export default nextConfig;
