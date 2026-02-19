import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getGameUrl, gameTransferOut } from '@/lib/api/game';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/PageLoader';

// 加载页背景装饰：三个 SVG 图案均匀平铺（每个都做了平移修正，保证在 viewBox 内可见）
const LOADING_BG_ICONS = [
  // 图案1：坐标已在 0~100 内，直接显示
  <svg key="qp" width="100%" height="100%" viewBox="0 0 100 76" fill="currentColor" style={{ opacity: 0.06 }}><path d="M19.214,44.515l.307-5.581a5,5,0,0,1-.858.422,4.937,4.937,0,0,1-6.493-2.891,4.736,4.736,0,0,1,.066-3.8,4.878,4.878,0,0,1,1.16-1.58A5.052,5.052,0,0,1,15.1,30.066a5.494,5.494,0,0,1,2.223-.221s.135,0,.146-.1a.168.168,0,0,0-.035-.13.177.177,0,0,0-.1-.064,5,5,0,0,1-1.653-1.105A4.822,4.822,0,0,1,14.608,26.8a4.878,4.878,0,0,1,.069-3.852,5.019,5.019,0,0,1,1.158-1.611,5.163,5.163,0,0,1,4.73-1.227L21.217,8.48.864,15.947a1.326,1.326,0,0,0-.745.681,1.264,1.264,0,0,0-.033.992L14.131,53.926a1.284,1.284,0,0,0,.274.431,1.326,1.326,0,0,0,.424.3,1.37,1.37,0,0,0,1.023.031L31.52,48.927l-8.672-.455A3.916,3.916,0,0,1,20.2,47.225a3.682,3.682,0,0,1-.977-2.7Zm68.305-30.3L57.316.147a1.589,1.589,0,0,0-1.18-.062,1.547,1.547,0,0,0-.519.3,1.5,1.5,0,0,0-.365.473L35.308,41.441a1.47,1.47,0,0,0-.062,1.154,1.529,1.529,0,0,0,.8.86l30.2,14.089a1.591,1.591,0,0,0,1.185.06,1.558,1.558,0,0,0,.519-.3,1.505,1.505,0,0,0,.36-.471L88.242,16.25a1.47,1.47,0,0,0,.075-1.163,1.5,1.5,0,0,0-.309-.513,1.547,1.547,0,0,0-.491-.356ZM55.42,40.533l-4.2-1.989a17.29,17.29,0,0,0,7.36-4.325,16.372,16.372,0,0,0,1.056,8.308c-4.215-1.952-4.2-1.967-4.2-1.967Zm16.841-5.689A6.586,6.586,0,0,1,62.15,37.458a8.8,8.8,0,0,1-2.164-6.091V31.4a9.349,9.349,0,0,1-6.257,2.113A6.3,6.3,0,0,1,49.6,24.136c2.475-4.641,9.371-3.912,17.709-7.426C69.635,25.267,74.5,30.1,72.27,34.844ZM33.127,40.424l3.264-6.644-6.08-6.091-.608-.712a7.183,7.183,0,0,1,.517-9.74,6.268,6.268,0,0,1,9.167.884l.6.712.685-.65a7.072,7.072,0,0,1,4.338-1.967L51.433,3.138,25.442,1.767a1.476,1.476,0,0,0-.555.077,1.443,1.443,0,0,0-.482.278,1.4,1.4,0,0,0-.336.442,1.357,1.357,0,0,0-.137.526L21.659,44.643a1.368,1.368,0,0,0,.362,1.006,1.456,1.456,0,0,0,.99.462l14.808.782L35.01,45.581a3.921,3.921,0,0,1-2.042-2.21,3.768,3.768,0,0,1,.157-2.957Z" /></svg>,
  // 图案2：path 带 translate(-16386 -4751)，用外层 g 平移回视口 (16679, 13316) 使图形落在 0 0 100 76 内
  <svg key="dz" width="100%" height="100%" viewBox="0 0 100 76" fill="currentColor" style={{ opacity: 0.06 }}><g transform="translate(16679 13316)"><path d="M-293.314-8565.123h.031a2.061,2.061,0,0,1,0,.22,1.917,1.917,0,0,1-.031-.22Zm-17.942.22a21.768,21.768,0,0,1,1.05-5.6,17.532,17.532,0,0,1,2.356-4.311,16.8,16.8,0,0,1,5.355-4.956c.984-.5,1.724-.765,3-1.292a22.088,22.088,0,0,0,3-1.722,16.646,16.646,0,0,0,1.927-1.512c.46-.442.751-.943.645-1.075-.221-.263-2.21,1.309-4.5,1.723a11.591,11.591,0,0,1-4.281-.22c-1.105-.276-2.692-.781-5.143-1.29a6.864,6.864,0,0,0-1.5,0,4.52,4.52,0,0,0-3,1.723,8.15,8.15,0,0,0-1.184,3.232h-3.315l2.705-14.271h4.069v2.153c1.817-2.161,2.312-3.251,6.078-2.534.884.169,1.532.262,1.565.275-.08-.016-.062,0-.035,0h.035c.088.018.522.053,1,.15a22.336,22.336,0,0,1,3.857,1.295,18.972,18.972,0,0,0,3.428,1.081,9.9,9.9,0,0,0,4.5-.221,11.72,11.72,0,0,0,2.57-1.075,11.294,11.294,0,0,1,2.46,2.048,25.317,25.317,0,0,0-1.606,2.041c-1.546,2.462-3.074,5.265-3.856,6.469a24.053,24.053,0,0,0-3.214,8.62,20.274,20.274,0,0,0-.221,4.525c.042,2.112.115,3.924.181,4.529-1.64.075-3.362.153-4.9.22Zm-39.214-.22h.031a2.094,2.094,0,0,1,0,.22A1.45,1.45,0,0,1-350.469-8565.123Zm-17.942.22a21.761,21.761,0,0,1,1.05-5.6,17.591,17.591,0,0,1,2.353-4.311,16.838,16.838,0,0,1,5.358-4.956c.985-.5,1.724-.765,3-1.292a22.072,22.072,0,0,0,3-1.722,17.4,17.4,0,0,0,1.927-1.512c.46-.442.749-.943.643-1.075-.221-.263-2.21,1.309-4.5,1.723a11.6,11.6,0,0,1-4.283-.22c-1.105-.276-2.69-.781-5.143-1.29a6.865,6.865,0,0,0-1.5,0,4.513,4.513,0,0,0-3,1.727,8.169,8.169,0,0,0-1.189,3.229H-374l2.705-14.271h4.069v2.153c1.814-2.161,2.312-3.251,6.078-2.534.884.169,1.532.262,1.565.275-.08-.016-.062,0-.035,0h.035c.088.018.522.053,1,.15a22.353,22.353,0,0,1,3.857,1.295,18.959,18.959,0,0,0,3.426,1.081,9.9,9.9,0,0,0,4.5-.221,11.5,11.5,0,0,0,2.573-1.075,11.38,11.38,0,0,1,2.462,2.046,23.712,23.712,0,0,0-1.607,2.043c-1.547,2.462-3.074,5.265-3.854,6.469a24.054,24.054,0,0,0-3.216,8.62,20.28,20.28,0,0,0-.221,4.527c.046,2.11.115,3.922.181,4.527-1.64.075-3.362.153-4.9.22Zm48.978-3.923h.035a2.742,2.742,0,0,1,0,.322,2.184,2.184,0,0,1-.035-.333Zm-26.912.319a32.981,32.981,0,0,1,1.574-8.4c.744-2.039,2.112-8.074,4.767-11.84,2.736-3.878,4.036-5.691,6.118-6.754,1.472-.746,3.273-1.827,5.183-2.622a32.286,32.286,0,0,0,4.5-2.581,25.773,25.773,0,0,0,2.891-2.263c.689-.664,1.123-1.422.966-1.621-.318-.387-3.331,1.974-6.745,2.592a17.525,17.525,0,0,1-6.429-.324c-1.644-.412-4.035-1.169-7.711-1.937a10.2,10.2,0,0,0-2.25,0,6.807,6.807,0,0,0-4.5,2.581,12.4,12.4,0,0,0-1.781,4.848h-4.966v-19.389h6.1v3.229c2.725-3.243,7.514-6.891,13.174-5.816,1.326.253,2.3.4,2.347.417-.117-.021-.091,0-.053,0s.077.013.053,0c.135.024.785.086,1.505.234a33.317,33.317,0,0,1,5.785,1.938,28.146,28.146,0,0,0,5.142,1.616,14.9,14.9,0,0,0,6.747-.327,17.54,17.54,0,0,0,3.857-1.616,17.456,17.456,0,0,1,3.695,3.071,34.426,34.426,0,0,0-2.411,3.069c-2.316,3.69-4.608,7.893-5.782,9.7a36.141,36.141,0,0,0-4.82,12.928,100.528,100.528,0,0,0-.321,12.155c.068,3.162.17,5.882.274,6.789-2.462.115-5.043.221-7.344.319Zm61.75-22.777Zm-57.153,0Zm57.138-.015.111-.108c.044-.034-.08.1-.1.123Zm-57.153,0a1.3,1.3,0,0,1,.109-.105c.039-.037-.082.094-.093.12Zm35.408-22.154h0s0-.006,0-.006Zm-.02-.023a1.82,1.82,0,0,1,.159-.159c.064-.053-.121.144-.141.183Z" transform="translate(-16386 -4751.006)" /></g></svg>,
  // 图案3：内层 g 为 translate(-17101 -13371)，用外层 g 平移 (17101, 13371) 使图形落在 0 0 100 76 内
  <svg key="cp" width="100%" height="100%" viewBox="0 0 100 76" fill="currentColor" style={{ opacity: 0.06 }}><g transform="translate(17101 13371)"><g transform="translate(-17101 -13371)"><path fillRule="evenodd" d="M61.373,41.392a16.942,16.942,0,0,0,6.228,1.2A16.467,16.467,0,0,0,71.721,10.2a29.99,29.99,0,0,1,1,7.7q0,1.081-.075,2.144a4.262,4.262,0,0,1,.6-.066,5.32,5.32,0,0,1,2.3.442A5.51,5.51,0,0,1,77.5,21.762a3.185,3.185,0,0,1,.972,1.852,3.3,3.3,0,0,1-.2,1.963A2.783,2.783,0,0,1,76.99,27a3.574,3.574,0,0,1-2.086.561,4.57,4.57,0,0,1,1.326,2.08,3.518,3.518,0,0,1-.181,2.321,3.375,3.375,0,0,1-2.389,2.139,5.5,5.5,0,0,1-3.726-.358,7.1,7.1,0,0,1-1.315-.716,30.19,30.19,0,0,1-7.245,8.361ZM69.754,30.92a1.808,1.808,0,0,0,1.03.884,1.923,1.923,0,0,0,1.567.033,2.338,2.338,0,0,0,1.185-2.849,2.108,2.108,0,0,0-2.471-1.24,29.782,29.782,0,0,1-1.311,3.172Zm-56.284-10q-.148-1.487-.15-3.017a30.033,30.033,0,0,1,1.105-8.111,16.461,16.461,0,0,0,2.053,32.8,16.169,16.169,0,0,0,7.444-1.839,29.949,29.949,0,0,1-6.714-8.073L11.365,35.8l-.486-.917a4.2,4.2,0,0,1-.537-1.952,4.9,4.9,0,0,1,.139-1.947,12.567,12.567,0,0,1,1.065-2.705,8.619,8.619,0,0,0,.835-2.478,2.95,2.95,0,0,0-.3-1.719,1.739,1.739,0,0,0-2.7-.7,5.419,5.419,0,0,0-2.358,2.959l-1.22-2.358a7.422,7.422,0,0,1,3.068-2.984,4.825,4.825,0,0,1,3.417-.614,3.4,3.4,0,0,1,1.178.53Zm1.326,6.3q-.267.663-.685,1.5A12.819,12.819,0,0,0,13.167,31a1.58,1.58,0,0,0,.02,1.074l2.908-1.547a29.691,29.691,0,0,1-1.3-3.3Zm58.636-4.787a1.607,1.607,0,0,1,1.375-.04,1.37,1.37,0,0,1,.831.972,2,2,0,0,1-.084,1.426,1.892,1.892,0,0,1-.961,1.037A1.525,1.525,0,0,1,72.41,24.9,1.96,1.96,0,0,1,72.5,23.51a2.013,2.013,0,0,1,.939-1.072Z" /><path fillRule="evenodd" d="M35.346,11.314A16.456,16.456,0,1,1,18.958,27.77,16.456,16.456,0,0,1,35.346,11.314ZM35.346,0A27.772,27.772,0,1,1,7.684,27.77,27.772,27.772,0,0,1,35.346,0Z" transform="translate(7.69 0)" /><path fillRule="evenodd" d="M19.169,30.13a11.561,11.561,0,0,0,4.5.829,8.073,8.073,0,0,0,6.953-3.315,15.051,15.051,0,0,0,2.416-9.028,12.2,12.2,0,0,0-2-7.464,6.482,6.482,0,0,0-5.525-2.716A7.1,7.1,0,0,0,20.1,10.559a7.262,7.262,0,0,0-2.108,5.525,6.8,6.8,0,0,0,1.682,4.8,5.773,5.773,0,0,0,4.467,1.905,4.97,4.97,0,0,0,4.42-2.21l.049.119c-.075,4.482-1.768,6.77-5.364,6.77a7.351,7.351,0,0,1-4.089-1.125ZM23.2,13.008a2.763,2.763,0,0,1,2.177-1.083,2.564,2.564,0,0,1,2.234,1.251A5.156,5.156,0,0,1,28.44,16.1a3.28,3.28,0,0,1-.833,2.334,2.707,2.707,0,0,1-2.122.942,2.855,2.855,0,0,1-2.276-.97,4.137,4.137,0,0,1-.833-2.727A4.3,4.3,0,0,1,23.2,13.008Z" transform="translate(17.982 8.489)" /></g></g></svg>,
];

// 不规则图案顺序：图案1 图案2 图案3 图案2 图案3 图案1 图案3 图案1 图案3 图案1 ...
const LOADING_BG_ORDER = [0, 1, 2, 1, 2, 0, 2, 0, 2, 0, 1, 0, 1, 2, 1, 0, 2, 1, 2, 1, 0, 1, 0, 2, 0, 2, 0, 1, 2, 0, 1, 2, 1, 0, 2, 0, 1, 2, 0, 1, 0, 2, 1, 2, 0, 1, 2, 0];

// 斜向不规则均匀位置：左上到右下斜排 + 小幅错落（left%, top%, rotate°）
const LOADING_BG_POSITIONS: { left: string; top: string; rotate: number }[] = [
  { left: '2%', top: '3%', rotate: -8 }, { left: '18%', top: '8%', rotate: 5 }, { left: '35%', top: '2%', rotate: -4 }, { left: '52%', top: '10%', rotate: 6 }, { left: '68%', top: '4%', rotate: -6 }, { left: '85%', top: '6%', rotate: 3 },
  { left: '6%', top: '22%', rotate: 4 }, { left: '24%', top: '18%', rotate: -7 }, { left: '42%', top: '24%', rotate: 2 }, { left: '58%', top: '20%', rotate: -5 }, { left: '76%', top: '26%', rotate: 7 }, { left: '92%', top: '22%', rotate: -3 },
  { left: '0%', top: '38%', rotate: -2 }, { left: '20%', top: '42%', rotate: 6 }, { left: '38%', top: '36%', rotate: -6 }, { left: '56%', top: '44%', rotate: 4 }, { left: '74%', top: '40%', rotate: -4 }, { left: '94%', top: '46%', rotate: 5 },
  { left: '8%', top: '56%', rotate: 5 }, { left: '26%', top: '52%', rotate: -3 }, { left: '44%', top: '58%', rotate: -7 }, { left: '62%', top: '54%', rotate: 3 }, { left: '80%', top: '60%', rotate: 6 }, { left: '98%', top: '56%', rotate: -5 },
  { left: '4%', top: '72%', rotate: -5 }, { left: '22%', top: '76%', rotate: 4 }, { left: '40%', top: '70%', rotate: 2 }, { left: '60%', top: '78%', rotate: -6 }, { left: '78%', top: '74%', rotate: 5 }, { left: '96%', top: '80%', rotate: -2 },
  { left: '12%', top: '88%', rotate: 3 }, { left: '30%', top: '92%', rotate: -4 }, { left: '48%', top: '86%', rotate: 6 }, { left: '66%', top: '90%', rotate: -2 }, { left: '84%', top: '94%', rotate: 4 }, { left: '90%', top: '12%', rotate: -6 },
  { left: '10%', top: '14%', rotate: 2 }, { left: '28%', top: '32%', rotate: -5 }, { left: '46%', top: '14%', rotate: 5 }, { left: '64%', top: '32%', rotate: -3 }, { left: '82%', top: '16%', rotate: 3 }, { left: '14%', top: '64%', rotate: -4 },
  { left: '32%', top: '66%', rotate: 6 }, { left: '50%', top: '68%', rotate: -2 }, { left: '70%', top: '84%', rotate: 2 }, { left: '88%', top: '70%', rotate: -7 }, { left: '16%', top: '48%', rotate: 4 }, { left: '72%', top: '48%', rotate: -5 },
];

function GameLoadingBg() {
  const count = Math.min(LOADING_BG_ORDER.length, LOADING_BG_POSITIONS.length);
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
    }}>
      {Array.from({ length: count }, (_, i) => {
        const pos = LOADING_BG_POSITIONS[i];
        const iconIndex = LOADING_BG_ORDER[i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              width: 'clamp(36px, 8vw, 52px)',
              height: 'clamp(28px, 6vw, 40px)',
              transform: `rotate(${pos.rotate}deg)`,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {LOADING_BG_ICONS[iconIndex]}
          </div>
        );
      })}
    </div>
  );
}

export default function GamePage() {
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUserInfo } = useAuth();
  const [gameUrl, setGameUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState<string>('');
  const hasTransferredOut = useRef(false);
  const isLoadingRef = useRef(false); // 防止重复请求

  const platformName = searchParams.get('platform') || searchParams.get('api_code') || '';
  const vendorCode = searchParams.get('vendorCode') || ''; // 新游戏接口的供应商代码
  const gameType = parseInt(searchParams.get('gameType') || '0');
  const gameCode = searchParams.get('gameCode') || '0';


  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLButtonElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX - position.x;
    const startY = touch.clientY - position.y;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({ x: touch.clientX - startX, y: touch.clientY - startY });
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };



  useEffect(() => {
    
    const loadGame = async () => {
      
      // 防止重复请求
      if (isLoadingRef.current) {
        return;
      }
      
      // 优先从 URL 读取 token（Telegram 机器人等外部分发链接带 token 自动登录）
      let token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        const urlToken = searchParams.get('token');
        if (urlToken && urlToken.length > 10) {
          token = urlToken;
          localStorage.setItem('token', token);
          sessionStorage.setItem('token', token);
        }
      }
      
      // 检查登录状态
      if (!token) {
        console.warn('⚠️ 未登录，跳转到登录页');
        alert('请先登录后再进入游戏');
        navigate('/login');
        return;
      }

      if (!platformName) {
        console.error('❌ 缺少游戏平台参数');
        setError('缺少游戏平台参数');
        setLoading(false);
        return;
      }

      try {
        isLoadingRef.current = true; // 标记请求开始
        setLoading(true);
        setError(''); // 清除之前的错误
        
        // 添加超时保护
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('请求超时：30秒内未获取到响应'));
          }, 30000);
        });
        
        const gameUrlPromise = getGameUrl({
          api_code: platformName,
          gameType: gameType,
          gameCode: gameCode,
          isMobile: 1
        });
        
        const res = await Promise.race([gameUrlPromise, timeoutPromise]) as any;

        
        // 如果游戏URL获取成功，刷新用户余额（新游戏接口会自动转入余额）
        if (res?.status === 'success' || (res?.code === 200 && res?.status !== 'error')) {
          // 等待后端处理完成（deposit 操作需要时间）
          setTimeout(async () => {
            if (refreshUserInfo) {
              await refreshUserInfo(true);
            }
          }, 2000);
        }

        // 处理各种可能的响应格式
        let gameUrl = '';
        
        // 正确判断：status === 'error' 时视为失败，即使code是200
        if (res?.status === 'error') {
          let errorMsg = res?.message || res?.error || '启动游戏失败';
          // 将技术性错误消息转换为更友好的提示
          if (errorMsg.includes('Permission denied') || errorMsg.includes('lock.txt')) {
            errorMsg = '服务器繁忙，请稍后重试';
          } else if (errorMsg.includes('请勿频进行繁点击')) {
            errorMsg = '操作过于频繁，请稍后重试';
          }
          console.error('❌ 游戏启动失败:', errorMsg, res);
          setError(errorMsg);
          setLoading(false);
        } else if (res?.status === 'success' || (res?.code === 200 && res?.status !== 'error')) {
          const data = res.data || res || {};
          gameUrl = data.game_url || data.url || data.gameUrl || '';
          
          
          if (gameUrl) {
            setGameUrl(gameUrl);
            setLoading(false);
          } else {
            console.error('❌ 游戏URL为空, 响应数据:', JSON.stringify(res, null, 2));
            setError('获取游戏链接失败：URL为空');
            setLoading(false);
          }
        } else {
          const errorMsg = res?.message || res?.error || '启动游戏失败';
          console.error('❌ 游戏启动失败:', errorMsg, res);
          setError(errorMsg);
          setLoading(false);
        }
      } catch (error: any) {
        const apiCode = error?.code;
        const apiMsg = error?.message ?? error?.response?.data?.message ?? error?.response?.data?.error ?? error?.data?.message ?? error?.data?.error;
        const apiResponse = error?.response;
        const requestBody = error?.requestBody;
        console.error('❌ 启动游戏失败 - 详细日志:', {
          '请求参数': { platform: platformName, gameType, gameCode },
          '接口错误码': apiCode,
          '接口返回信息': apiMsg,
          '接口完整响应': apiResponse,
          '本次请求体': requestBody,
          '原始error': error,
          stack: error?.stack
        });
        
        const is401 = error?.response?.status === 401 || (apiMsg && /Unauthenticated|未授权|未登录/i.test(String(apiMsg)));
        const isLoginRequired =
          apiMsg === '请先登录' ||
          apiCode === 10001 ||
          (apiMsg && /Token已过期|未登录|请登录/i.test(String(apiMsg)));
        const isNetworkError = error?.code === 'ERR_NETWORK' ||
          error?.message?.includes('网络请求失败') ||
          error?.message?.includes('Network Error') ||
          error?.message?.includes('Failed to fetch') ||
          error?.isNetworkError;
        if (isLoginRequired || is401) {
          setError('请先登录');
          alert('请先登录后再进入游戏');
          navigate('/login');
        } else if (isNetworkError) {
          setError('网络连接失败，请检查网络或联系客服。');
        } else {
          let errorMessage = apiMsg || '启动游戏失败，请稍后重试';
          if (apiCode != null) {
            errorMessage = `[${apiCode}] ${errorMessage}`;
          }
          setError(errorMessage);
        }
        setLoading(false);
      } finally {
        isLoadingRef.current = false; // 标记请求结束
      }
    };

    loadGame();
  }, [platformName, gameType, gameCode, navigate]);

  // 游戏转出逻辑（使用 useCallback 避免重复创建）
  const handleTransferOut = useCallback(async () => {
    // 如果已经转出过，直接返回
    if (hasTransferredOut.current) {
      console.log('ℹ️ 已经转出过，跳过');
      return;
    }

    try {
      hasTransferredOut.current = true;
      console.log('🔄 开始转出余额:', { platformName });
      
      if (platformName) {
        // 使用旧接口转出
        console.log('✅ 使用旧接口转出:', platformName);
        const res = await gameTransferOut(platformName);
        
        // 检查响应状态：status === 'error' 时视为失败，即使code是200
        if (res.status === 'error') {
          console.warn('⚠️ 游戏余额转出失败:', res.message);
        } else if (res.code === 200 || res.status === 'success') {
          // 刷新用户余额
          if (refreshUserInfo) {
            await refreshUserInfo(true);
          }
        } else {
          console.warn('⚠️ 游戏余额转出失败:', res.message);
        }
      } else {
        console.warn('⚠️ 没有平台信息，无法转出');
      }
    } catch (err) {
      console.error('❌ 游戏余额转出异常:', err);
      // 转出失败不影响返回，只记录错误
    }
  }, [platformName, vendorCode, refreshUserInfo]);

  // 页面卸载/隐藏时自动转出
  useEffect(() => {
    if (!platformName) return;

    // 监听页面隐藏事件（切换标签页、最小化等）
    const handleVisibilityChange = () => {
      if (document.hidden && !hasTransferredOut.current) {
        // 页面隐藏时尝试转出
        handleTransferOut().catch(() => {
          // 忽略错误
        });
      }
    };

    // 监听页面卸载事件（浏览器关闭/刷新）
    const handleBeforeUnload = () => {
      if (!hasTransferredOut.current) {
        // 使用同步方式发送请求（使用 fetch keepalive）
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          
          if (!token) {
            return;
          }
          
          const apiBaseUrl = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api');
          if (platformName) {
            const lang = localStorage.getItem('ly_lang') || 'zh_cn';
            const url = `${apiBaseUrl}/game/change_trans?lang=${lang}`;
            
            const data = new URLSearchParams({
              api_code: platformName,
              type: 'out'
            });

            // 使用 fetch with keepalive（即使页面关闭也能发送）
            fetch(url, {
              method: 'POST',
              body: data,
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              keepalive: true
            }).catch(() => {
              // 忽略错误
            });
            
            hasTransferredOut.current = true;
          }
        } catch (err) {
          // 忽略错误
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 组件卸载时也尝试转出
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // 组件卸载时同步转出
      if (!hasTransferredOut.current && platformName) {
        handleTransferOut().catch(() => {
          // 忽略错误
        });
      }
    };
  }, [platformName, vendorCode, handleTransferOut]);

  // 调试信息

  if (exiting) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
      }}>
        <GameLoadingBg />
        <img
          src="/images/newimg/gameloading.gif"
          alt="loading"
          style={{ width: '80px', height: '80px', objectFit: 'contain', position: 'relative', zIndex: 1 }}
        />
        <span style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '14px',
          letterSpacing: '1px',
          position: 'relative',
          zIndex: 1,
        }}>正在结算，请稍候...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <GameLoadingBg />
        <img
          src="/images/newimg/gameloading.gif"
          alt="loading"
          style={{ width: '80px', height: '80px', objectFit: 'contain', position: 'relative', zIndex: 1 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1a1a1a',
        color: 'white',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#ff4444', marginBottom: '20px' }}>❌ 加载失败</h2>
          <p style={{ marginBottom: '30px' }}>{error}</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if(gameUrl == '111'){
    console.warn('⚠️ 返回');
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1a1a1a',
        color: 'white',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        
      <img
        src="/images/week/11.png"
        alt="背景"
        style={{
          display: 'block',
          width: '100%',
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      </div>
    );
  }// 如果没有游戏URL，显示错误
  else if (!gameUrl && !error) {
    console.warn('⚠️ 没有游戏URL也没有错误，显示默认错误');
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1a1a1a',
        color: 'white',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#ff4444', marginBottom: '20px' }}>❌ 游戏URL为空</h2>
          <p style={{ marginBottom: '30px' }}>未能获取到游戏链接，请稍后重试</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 返回按钮点击处理
  const handleBack = async () => {
    setExiting(true);
    await handleTransferOut();
    navigate('/game-lobby');
  };

  
  return (
    <>
      <PageLoader loading={loading} />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        zIndex: 9999,
        backgroundColor: '#000'
      }}>
      <iframe
        src={gameUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: gameUrl ? 'block' : 'none'
        }}
        title="游戏"
        allow="fullscreen; autoplay; microphone; camera; payment; geolocation; encrypted-media; picture-in-picture; display-capture; web-share"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        // 移动端和视频直播游戏需要完全移除 sandbox 限制以支持 WebSocket 连接
        // 检测是否为移动端
        // 检测是否为视频直播游戏（Pragmatic Live, Evolution 等）
        sandbox={
          (() => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isVideoLiveGame = 
              vendorCode === 'casino-playace' || 
              vendorCode === 'casino-evolution' ||
              vendorCode === 'casino-sa' ||
              vendorCode === 'casino-micro' ||
              vendorCode === 'casino-ezugi' ||
              gameUrl?.includes('pragmatic') || 
              gameUrl?.includes('thefanz.net') ||
              gameUrl?.includes('evolution') ||
              gameUrl?.includes('playace');
            
            // 移动端或视频直播游戏：完全移除 sandbox 限制
            if (isMobileDevice || isVideoLiveGame) {
              return undefined;
            }
            
            // 其他游戏：使用 sandbox 限制
            return "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-presentation allow-downloads allow-storage-access-by-user-activation";
          })()
        }
        onLoad={() => {
          // iframe 加载完成
          console.log('✅ iframe 加载完成', {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            vendorCode,
            gameUrl: gameUrl?.substring(0, 100)
          });
        }}
        onError={(e) => {
          console.error('❌ iframe 加载错误:', e);
          console.error('📱 错误时的设备信息:', {
            userAgent: navigator.userAgent,
            platform: platformName,
            vendorCode: vendorCode,
            gameUrl: gameUrl?.substring(0, 100),
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          });
        }}
      />
      
        <button
          ref={ref}
          // onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleBack}
          style={{
            position: 'fixed',
            left: position.x, 
            top: position.y,
            zIndex: 9999,
            width: '60px',
            height: '60px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: '2px solid #C0C0C0',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '10px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '4px'
          }}
        >
          <svg 
            viewBox="0 0 1024 1024" 
            version="1.1" 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24"
            style={{ flexShrink: 0 }}
          >
            <path 
              d="M660.931435 397.915685c-16.344916-15.452947-31.059639-29.41903-44.134958-41.900296l-33.88101-31.204699c-8.917456-8.327666-14.263426-13.375635-16.048145-15.160281-16.641687-15.454994-35.369981-22.730701-56.171579-21.840424-20.805691 0.889253-38.638555 8.1711-53.4945 21.840424-2.383378 2.378164-8.177575 7.875365-17.390778 16.499789-9.20911 8.619308-20.653212 19.164478-34.32412 31.646767-13.668861 12.476149-28.82567 26.301016-45.473497 41.453111-16.645781 15.162328-33.287468 30.464849-49.923015 45.918819-39.830756 36.252669-84.111029 76.670194-132.854124 121.247458L177.235709 912.096351c0 14.262842 5.054316 25.261337 15.157832 32.984229 10.108633 7.730055 23.778517 11.588943 41.016816 11.588943l175.649519 0c-0.119732-1.866511-0.2016-3.744277-0.2016-5.641487L408.858277 798.964734c0-48.060599 38.961933-87.020936 87.025525-87.020936l32.231373 0c48.062568 0 87.024501 38.960337 87.024501 87.020936l0 152.064324c0 1.89721-0.081868 3.773953-0.2016 5.641487l175.72013 0c16.643734-0.590448 29.869485-5.941316 39.672137-16.044418 9.811862-10.106172 14.717793-21.695115 14.717793-34.770921l0-337.650113c-49.33766-45.76737-93.917774-87.074148-133.740343-123.926474C694.066424 428.824649 677.276351 413.370679 660.931435 397.915685zM959.165779 478.153124c-0.595589-14.266935-7.128643-27.336602-19.61349-39.225373l-22.291592-22.287609c-11.289577-11.295254-25.256232-24.817222-41.904059-40.563858-16.641687-15.754822-34.919708-33.43653-54.833039-53.049217-19.907191-19.617803-40.272842-39.375799-61.073416-59.290361-20.805691-19.915585-41.308471-39.673581-61.513456-59.291384-20.219312-19.612687-38.492216-37.294394-54.842249-53.0441-16.3398-15.750729-30.167279-29.127388-41.454809-40.120766-11.29674-10.998495-18.724201-17.97949-22.295686-20.955264-18.42129-17.83418-40.708789-26.598798-66.871707-26.295899-26.146545 0.296759-50.522697 11.435447-73.103897 33.431414-2.97692 2.967588-13.526616 12.924357-31.653181 29.863145-18.129635 16.941857-39.824616 37.298488-65.086988 61.07603-25.265442 23.775496-52.604187 49.333592-82.029539 76.67531-29.420235 27.336602-56.913506 52.898791-82.470602 76.670194-25.559143 23.777543-47.550894 44.284599-65.978324 61.519122-18.426406 17.2335-29.420235 27.6395-32.990697 31.203676-9.509974 8.916067-14.564291 20.951171-15.152716 36.103266-0.597635 15.161305 5.0492 28.091802 16.938458 38.788421 10.701151 9.508561 23.480723 13.964036 38.336668 13.371542 14.860038-0.594541 26.749297-4.455475 35.665729-11.586896 2.972826-2.379187 11.737803-10.254551 26.303117-23.626094 14.559174-13.372565 31.948929-29.574572 52.155961-48.594765 20.212149-19.018146 42.204923-39.522132 65.982417-61.512982 23.7734-21.995967 46.362787-43.092447 67.756903-63.303768 21.400256-20.207227 40.272842-37.887912 56.617758-53.05024 16.344916-15.152095 27.489177-25.405623 33.438923-30.751375 17.829794-16.052604 35.958406-24.375154 54.379696-24.968671 18.431523-0.592494 37.155724 7.730055 56.176695 24.968671 4.158887 3.565199 13.965632 12.773931 29.420235 27.633361 15.454603 14.860453 33.886127 32.396851 55.278196 52.602032 21.401279 20.212344 44.138028 41.756009 68.206153 64.642253 24.079381 22.881127 46.660581 44.279483 67.76816 64.188928 21.099392 19.909445 39.22698 37.001729 54.384813 51.263547 15.157832 14.267958 24.215487 22.590508 27.192406 24.968671 8.916432 7.723915 20.804667 11.889795 35.658565 12.478196 14.863108 0.596588 27.944567-4.158716 39.232097-14.262842C955.005869 504.308831 959.761368 492.420059 959.165779 478.153124z" 
              fill="#ffffff"
            />
          </svg>
          <span style={{ fontSize: '10px', lineHeight: '1' }}>首页</span>
        </button>
      
    </div>
    </>
  );
}

