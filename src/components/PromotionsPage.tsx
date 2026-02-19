import { useState } from 'react';

export function PromotionsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [rankingTab, setRankingTab] = useState(0); // 0: 优惠, 1: 俱乐部

  // 领取记录数据
  const rewardRecords = [
    { user: '****c00', amount: '609,840' },
    { user: '****age', amount: '574,560' },
    { user: '****99c', amount: '504,000' },
    { user: '****r88', amount: '395,640' },
    { user: '****818', amount: '357,840' },
    { user: '****f7c', amount: '252,770' },
    { user: '****s66', amount: '248,262' },
    { user: '****792', amount: '247,100' },
    { user: '****078', amount: '228,620' },
    { user: '****ktt', amount: '171,360' },
  ];

  // 优惠活动数据
  const promotions = [
    {
      id: 1,
      image: 'https://www.xpj00000.vip/indexImg/a67b5580e5b8ce2c6c24860bb39c3f62.jpg_.webp',
      title: '要爱要爱～投注满1688万～送商务伴游',
      isNew: true,
      endTime: '9天17时31分'
    },
    {
      id: 2,
      image: 'https://www.xpj00000.vip/indexImg/804307eafb93a1e5a09757c3fd8ce9a2.jpg_.webp',
      title: '马竞第6弹 五大联赛 日领12,888元',
      isNew: true,
      endTime: '23天17时31分'
    },
    {
      id: 3,
      image: 'https://www.xpj00000.vip/indexImg/a851ecd38966066766898b2f95e9e0d0.jpg_.webp',
      title: '一击必中 老虎机挑战赛赢888,888币',
      isNew: false,
      endTime: '26天17时31分'
    },
    {
      id: 4,
      image: 'https://www.xpj00000.vip/indexImg/7d3e152826ad31d73ba7067c266ed146.jpg_.webp',
      title: '发财圈畅所欲言 互动领取优惠～',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 5,
      image: 'https://www.xpj00000.vip/indexImg/2656eab28bb8bb6523cd7b4fb02d5582.jpg_.webp',
      title: '周周送免费旋转 K8币 精美礼品',
      isNew: true,
      endTime: '30天17时31分'
    },
    {
      id: 6,
      image: 'https://www.xpj00000.vip/indexImg/7a2246923be25eac700105100eb68e42.jpg_.webp',
      title: 'PA国际赌神赛 总奖金20万元',
      isNew: true,
      endTime: '13天17时31分'
    },
    {
      id: 7,
      image: 'https://www.xpj00000.vip/indexImg/ae5e49cf194fba9e9ccd1f0936f5bc8b.jpg_.webp',
      title: '电游签到领最高188次免费旋转',
      isNew: false,
      endTime: '26天17时31分'
    },
    {
      id: 8,
      image: 'https://www.xpj00000.vip/indexImg/c5d6c3a1430dfe4681ec627352c598b1.jpg_.webp',
      title: '直播间红包超燃上线 限时天天送888币',
      isNew: false,
      endTime: '26天17时31分'
    },
    {
      id: 9,
      image: 'https://www.xpj00000.vip/indexImg/6fc739d088ad64d04afa25ea21f7ec4d.jpg_.webp',
      title: '棋有此礼 每日领8888元',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 10,
      image: 'https://www.xpj00000.vip/indexImg/6177f98f88979a46ae44c66c42dd9735.jpg_.webp',
      title: '发财圈首帖献礼 限时赠送888币',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 11,
      image: 'https://www.xpj00000.vip/indexImg/8c9575f5e57d890c371e47948676ca18.png_.webp',
      title: '银行卡卖币 充值USDT 汇率再加码',
      isNew: false,
      endTime: '26天17时31分'
    },
    {
      id: 12,
      image: 'https://www.xpj00000.vip/indexImg/bde521d12aba06b12cb252b671a70f4f.jpg_.webp',
      title: '升星送888 月分红588 周周送百战称王门票',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 13,
      image: 'https://www.xpj00000.vip/indexImg/97668e16c935ee0e3325ac438647623d.jpg_.webp',
      title: '每日锦标赛 2,500万元奖金发送中',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 14,
      image: 'https://www.xpj00000.vip/indexImg/c8dc711217e5104b08ca5141594d94ee.jpg_.webp',
      title: '新会员专享 多存多送 最高赠送88888元',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 15,
      image: 'https://www.xpj00000.vip/indexImg/369f7251542719240da8ad03c0767788.png_.webp',
      title: '每日16:00、20:00,场场万元大奖等你来赢',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 16,
      image: 'https://www.xpj00000.vip/indexImg/af12d00802397c87d7d8aa02b7e935bf.jpg_.webp',
      title: '年利率36% 保底15% 加码抽价值200万跑车',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 17,
      image: 'https://www.xpj00000.vip/indexImg/b903ac39251af2ca3af8758646cbcec4.jpg_.webp',
      title: '洗码秒到账·礼金无上限·流水无限制',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 18,
      image: 'https://www.xpj00000.vip/indexImg/f3b25c70e3f77edc87f713946b457ddc.png_.webp',
      title: '投注三宝、免佣庄、幸运6免费参加~',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 19,
      image: 'https://www.xpj00000.vip/indexImg/9c6eeec798d74e22994fff9ca54a2cdf.png_.webp',
      title: '月月分红·免息贷款·晋级礼金',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 20,
      image: 'https://www.xpj00000.vip/indexImg/99d5e9551dd49821e8f0c0b02f03287d.jpg_.webp',
      title: '菲律宾极致探索之旅',
      isNew: false,
      endTime: '活动长期有效'
    },
    {
      id: 21,
      image: 'https://www.xpj00000.vip/indexImg/9d10e909e4568e25b831b1d9c45b7bda.jpg_.webp',
      title: '推荐好友 佣金拿到手抽筋',
      isNew: false,
      endTime: '活动长期有效'
    },
  ];

  // 排行榜数据
  const leaderboard = [
    { rank: 1, user: '****s66', level: '黄金7星', reward: '5,369,557' },
    { rank: 2, user: '****s88', level: '黄金6星', reward: '4,606,491' },
    { rank: 3, user: '****age', level: '黑金1星', reward: '4,582,144' },
    { rank: 4, user: '****c00', level: '黑金2星', reward: '4,133,258' },
    { rank: 5, user: '****99c', level: '钻石7星', reward: '3,952,101' },
    { rank: 6, user: '****r88', level: '钻石4星', reward: '3,365,247' },
    { rank: 7, user: '****ktt', level: '铂金5星', reward: '3,021,125' },
    { rank: 8, user: '****f7c', level: '钻石4星', reward: '1,586,399' },
    { rank: 9, user: '****397', level: '白银6星', reward: '679,858' },
    { rank: 10, user: '****818', level: '钻石3星', reward: '677,054' },
  ];

  const tabs = ['全部', '最新', '长期'];

  return (
    <>
      <div style={{ backgroundColor: '#0C1017', minHeight: '100vh', paddingBottom: '80px' }}>
        {/* 导航标签栏 */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: '#0C1017',
          zIndex: 10,
          padding: '16px',
          borderBottom: '1px solid #1a1f35'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            background: '#1a1f35',
            borderRadius: '8px',
            padding: '4px',
            position: 'relative'
          }}>
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: activeTab === index ? 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)' : 'transparent',
                  color: activeTab === index ? '#ffffff' : '#8a8f9f',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: activeTab === index ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  zIndex: 1
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 优惠活动列表 */}
        <div style={{ padding: '0 16px 16px' }}>
          {promotions.map((promo) => (
            <div
              key={promo.id}
              style={{
                background: '#1a1f35',
                borderRadius: '12px',
                marginBottom: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* 活动图片 */}
              <div style={{ position: 'relative' }}>
                <img
                  src={promo.image}
                  alt={promo.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </div>

              {/* 活动信息 */}
              <div style={{ padding: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  {promo.isNew && (
                    <img
                      src="https://www.xpj00000.vip/indexImg/new-activity.ac54c623.png"
                      alt="新活动"
                      style={{ height: '20px' }}
                    />
                  )}
                  <div style={{
                    color: '#ffd700',
                    fontSize: '12px',
                    marginLeft: 'auto'
                  }}>
                    限时结束：{promo.endTime}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    margin: 0,
                    flex: 1
                  }}>
                    {promo.title}
                  </h3>
                  <img
                    src="https://www.xpj00000.vip/indexImg/arrow.7a71763b.png"
                    alt="箭头"
                    style={{ width: '16px', height: '16px', marginLeft: '8px' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 排行榜模块 */}
        <div style={{
          margin: '0 16px 16px',
          background: '#1a1f35',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* 排行榜标题 */}
          <div style={{
            background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="https://www.xpj00000.vip/indexImg/rank-icon.75855dab.png"
                alt="排行榜"
                style={{ width: '24px', height: '24px' }}
              />
              <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
                排行榜
              </span>
            </div>
            <span style={{ color: '#ffffff', fontSize: '12px' }}>榜单规则</span>
          </div>

          {/* 排行榜切换标签 - 使用背景图片 */}
          <div style={{
            height: '60px',
            background: '#151a23 url(https://www.xpj00000.vip/indexImg/table-bg.247ad9b1.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <button
              onClick={() => setRankingTab(0)}
              style={{
                flex: 1,
                height: '100%',
                background: 'transparent',
                color: rankingTab === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                fontSize: '14px',
                fontWeight: rankingTab === 0 ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative'
              }}
            >
              优惠
              {rankingTab === 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '3px',
                  background: '#4a90e2',
                  borderRadius: '2px 2px 0 0'
                }} />
              )}
            </button>
            <button
              onClick={() => setRankingTab(1)}
              style={{
                flex: 1,
                height: '100%',
                background: 'transparent',
                color: rankingTab === 1 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                fontSize: '14px',
                fontWeight: rankingTab === 1 ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative'
              }}
            >
              俱乐部
              {rankingTab === 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '3px',
                  background: '#4a90e2',
                  borderRadius: '2px 2px 0 0'
                }} />
              )}
            </button>
          </div>

          {/* 表头 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 80px 100px',
            padding: '12px 16px',
            background: '#252b42',
            color: '#8a8f9f',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            <div>排名</div>
            <div>会员账号</div>
            <div>星级</div>
            <div style={{ textAlign: 'right' }}>累计奖励(元)</div>
          </div>

          {/* 排行榜列表 */}
          {leaderboard.map((item) => (
            <div
              key={item.rank}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 80px 100px',
                padding: '12px 16px',
                borderTop: '1px solid #252b42',
                color: '#ffffff',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {item.rank <= 3 ? (
                  <img
                    src={`https://www.xpj00000.vip/indexImg/${item.rank}.${item.rank === 1 ? '1f2527fe' : item.rank === 2 ? '124db791' : '9a0cbbbf'}.png`}
                    alt={`第${item.rank}名`}
                    style={{ width: '24px', height: '24px' }}
                  />
                ) : (
                  <span style={{ color: '#8a8f9f' }}>{item.rank}</span>
                )}
              </div>
              <div>{item.user}</div>
              <div style={{ fontSize: '12px', color: '#ffd700' }}>{item.level}</div>
              <div style={{ textAlign: 'right', color: '#ffd700' }}>{item.reward}</div>
            </div>
          ))}

          {/* 底部提示 */}
          <div style={{
            padding: '12px 16px',
            textAlign: 'center',
            color: '#8a8f9f',
            fontSize: '12px',
            borderTop: '1px solid #252b42'
          }}>
            *每30分钟刷新1次
          </div>
        </div>
      </div>
    </>
  );
}