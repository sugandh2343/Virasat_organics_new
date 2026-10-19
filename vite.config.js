import fs from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { localApiOriginGuard } from './scripts/local-api-origin-guard.mjs';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'https://virasatorganics.com';
  if (env.API_PROXY_ENABLED === 'true' && target !== 'https://virasatorganics.com') throw new Error('The development API proxy target must be explicitly reviewed before changing hosts.');
  return {
    base: '/',
    plugins: [react(),{
      name:'local-api-origin-guard',
      configureServer(server){
        if (env.API_PROXY_ENABLED === 'true') server.middlewares.use(localApiOriginGuard);
      },
    }],
    server: env.API_PROXY_ENABLED === 'true' ? { host:'localhost', port:5190, strictPort:true, https: env.DEV_HTTPS_CERT && env.DEV_HTTPS_KEY ? {cert:fs.readFileSync(env.DEV_HTTPS_CERT),key:fs.readFileSync(env.DEV_HTTPS_KEY)} : undefined, proxy: { '/api': {
      target, changeOrigin: true, secure: true,
      // Development proxy targets the same remote application. No token/cookie weakening.
      configure(proxy) {
        proxy.on('proxyReq', (proxyReq) => { proxyReq.setHeader('Origin', target); });
      },
    } } } : undefined,
  };
});

