
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import dns from 'dns';

  // 获取当前文件所在目录
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  
  // 获取项目根目录
  const root = path.resolve(__dirname);

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'figma:asset/5d5e5546533189a7a5de26f80e5e39c5ab751478.png': path.resolve(__dirname, './src/assets/5d5e5546533189a7a5de26f80e5e39c5ab751478.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@': path.resolve(root, 'src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
    server: {
      port: 3000,
      open: true,
      // Vite 开发服务器默认支持 SPA 路由（history API fallback）
      proxy: {
        // 优先：bet-proxy 走同源后由本代理转发到远程，避免浏览器直连导致 CORS
        '/api/bet-proxy': {
          target: process.env.VITE_BET_PROXY_URL || 'https://api.amjsvip.cc',
          changeOrigin: true,
          secure: true,
        },
        '/api': {
          // ⚠️ 重要：这里指向后端 API 服务器（美盛游戏接口所在）
          // 默认：https://admin.amjsvip.cc；可通过 VITE_BACKEND_URL 覆盖
          target: process.env.VITE_BACKEND_URL || 'https://admin.amjsvip.cc',
          changeOrigin: true,
          secure: true, // 使用HTTPS
          // 保持 /api 路径，因为后端接口需要 /api 前缀
          // rewrite: (path) => path.replace(/^\/api/, '')  // 不需要重写，保持 /api
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // 设置请求头
              proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '');
              proxyReq.setHeader('X-Forwarded-Proto', 'https');
              const targetHost = process.env.VITE_BACKEND_URL 
                ? new URL(process.env.VITE_BACKEND_URL).hostname 
                : 'admin.amjsvip.cc';
              proxyReq.setHeader('X-Forwarded-Host', targetHost);
            });
            
            proxy.on('error', (err, req, res) => {
              console.error('❌ Vite代理错误:', err.message);
              const targetUrl = process.env.VITE_BACKEND_URL || 'https://admin.amjsvip.cc';
              console.error('💡 提示: 请确保后端API服务器', targetUrl, '可访问');
              console.error('💡 如果后端在其他地址，请设置环境变量 VITE_BACKEND_URL');
            });
          }
        }
      }
    },
    preview: {
      port: 3000,
      // Vite 预览服务器默认支持 SPA 路由
    },
  });