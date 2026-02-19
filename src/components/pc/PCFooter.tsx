import React from 'react';
import { getServiceUrl } from '@/lib/api/system';

/**
 * PC端底部组件
 * 对应 k8_pc 的 Foot.vue
 */
export default function PCFooter() {
  const openKefu = async () => {
    try {
      const res = await getServiceUrl();
      if (res.code === 200 && res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        alert(res.message || '获取客服链接失败');
      }
    } catch (error) {
      alert('打开客服失败，请稍后重试');
    }
  };

  return (
    <footer
      id="homeFooter"
      className="footer"
      style={{
        background: '#1a1a1a',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="fixed-bottom">
        <div className="tool">
          <button
            className="btn-min btm-icons"
            onClick={openKefu}
            style={{
              padding: '10px 20px',
              background: '#ffcb4c',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            联系客服
          </button>
        </div>
        <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
          © 2024 九洲娱乐. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

