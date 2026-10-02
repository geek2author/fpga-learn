import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // GitHub Pages 子路径托管 + 本地根路径两相宜（本应用无路由）
  plugins: [react()],
  server: {
    host: true, // 监听 0.0.0.0：手机连同一 Wi-Fi 可直接访问
    watch: {
      // Windows 下文件事件偶发丢失会导致 HMR 后服务陈旧模块，改用轮询监视
      usePolling: true,
      interval: 300,
    },
  },
});
