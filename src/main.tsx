
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/globals.css";

  // 同步从 URL 读取 token（Telegram 等外部分发链接），确保首屏即登录状态
  function saveTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let urlToken = params.get('token');
    if (!urlToken && window.location.hash) {
      const hashStr = window.location.hash.replace(/^#/, '').replace(/^\?/, '');
      const hashParams = new URLSearchParams(hashStr);
      urlToken = hashParams.get('token') || hashParams.get('access_token');
    }
    if (urlToken && urlToken.length > 10) {
      localStorage.setItem('token', urlToken);
      sessionStorage.setItem('token', urlToken);
      window.dispatchEvent(new Event('authStateChange'));
      return true;
    }
    return false;
  }
  saveTokenFromUrl();
  // Telegram WebView 等环境可能延迟解析 URL，100ms 后再检查一次
  setTimeout(saveTokenFromUrl, 100);

  createRoot(document.getElementById("root")!).render(<App />);
  