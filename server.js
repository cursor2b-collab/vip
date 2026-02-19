/**
 * 简单的 Node.js 静态文件服务器
 * 用于生产环境部署，支持 SPA 路由
 * 
 * 使用方法：
 * 1. 安装依赖: npm install express
 * 2. 构建项目: npm run build
 * 3. 运行服务器: node server.js
 */

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// 静态文件服务
app.use(express.static(DIST_DIR));

// SPA 路由支持 - 所有路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 静态文件目录: ${DIST_DIR}`);
  console.log(`✅ SPA 路由已启用，所有路由将回退到 index.html`);
});
