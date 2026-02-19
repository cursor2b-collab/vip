/**
 * 测试页面 - 验证路由是否工作
 */
export default function TestPage() {
  return (
    <div style={{ padding: '20px', background: '#0c1017', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>🎉 测试页面</h1>
      <p style={{ fontSize: '18px', marginBottom: '10px' }}>
        ✅ 如果您看到这个页面，说明路由工作正常！
      </p>
      <p style={{ fontSize: '16px', color: '#ffd700' }}>
        这意味着个人中心和优惠活动页面也应该能正常访问。
      </p>
      <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>访问这些页面：</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <a href="/profile" style={{ color: '#ffd700', fontSize: '16px' }}>
              → 个人中心 (/profile)
            </a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a href="/promotions" style={{ color: '#ffd700', fontSize: '16px' }}>
              → 优惠活动 (/promotions)
            </a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a href="/login" style={{ color: '#ffd700', fontSize: '16px' }}>
              → 登录页面 (/login)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}



