/**
 * 客服页面 - 从Vue转换
 */
import React, { useState, useEffect } from 'react';
import { getServiceUrl } from '@/lib/api/system';

interface FAQItem {
  question: string;
  answer: string;
  expanded: boolean;
}

export default function ServicePage() {
  const [servicePhone] = useState('4008426138');
  const [serviceUrl, setServiceUrl] = useState('');
  const [faqList, setFaqList] = useState<FAQItem[]>([
    {
      question: '如何注册？',
      answer: '注册方式有两种：<br>1、请点击网站首页"账号注册"按钮，按照界面所规定的填写内容进行自助注册。<br>2、联系在线客服提供您要开户的账号和密码即可开出游戏账号。',
      expanded: false
    },
    {
      question: '忘记密码怎么办？',
      answer: '(1) 您可以自行找回密码：于登录页面的密码左下方点击[忘记账号、密码？]，选择[我忘记密码了]，依据提示自助找回密码即可<br>(2) 您可以联系24小时网页在线客服人员，提交该账户绑定的个人信息，客服人员将协助您找回您的账号密码。',
      expanded: false
    },
    {
      question: '怎么充值？',
      answer: '登录账号后进入存款页面，选择您要的存款支付方式并输入金额，根据页面提示进行USDT充值或者人民币充值，交易完成后充值金额将会自动存入B77账户中。',
      expanded: false
    },
    {
      question: '游戏结束后如何提现？',
      answer: '登录账号后进入取款页面，输入取款金额（第一次取款须绑定B77卡包）选择对应卡包提取款，确认取款后约10-20分钟内转入您的指定取款账户。',
      expanded: false
    }
    // {
    //   question: '提币到账如何变现？',
    //   answer: '登录账号后进入提币页面，点选"卖币变现"进入后选择您要的交易所，输入卖币数量进行提交，使用您的钱包向交易所提供的转币地址进行转账，交易成功后变现的金额会自动转入您提供的指定账户中。更详细的操作可以到首页的"数字币充提指南"查看哦。',
    //   expanded: false
    // }
  ]);

  useEffect(() => {
    // 获取客服链接（从管理后台设置）
    const fetchServiceUrl = async () => {
      try {
        const res = await getServiceUrl();
        
        if (res.code === 200 && res.data && res.data.url) {
          setServiceUrl(res.data.url);
        } else {
          setServiceUrl('');
        }
      } catch (err: any) {
        setServiceUrl('');
      }
    };
    fetchServiceUrl();
  }, []);

  const toggleFaq = (index: number) => {
    setFaqList(prev => {
      const newList = [...prev];
      newList[index].expanded = !newList[index].expanded;
      return newList;
    });
  };

  const callService = () => {
    window.location.href = `tel:${servicePhone}`;
  };

  const openOnlineService = () => {
    if (serviceUrl) {
      window.open(serviceUrl, '_blank');
    } else {
      alert('客服系统加载中，请稍后再试...');
      // 尝试重新获取客服链接
      getServiceUrl().then(res => {
        if (res.code === 200 && res.data && res.data.url) {
          setServiceUrl(res.data.url);
          window.open(res.data.url, '_blank');
        }
      }).catch(err => {
      });
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      background: '#151A23',
      paddingBottom: '80px'
    }}>
      {/* 客服中心头部 */}
      <div style={{
        background: '#2D232C',
        padding: '20px 0 20px 0', // 去除左右内边距
        marginBottom: '-20px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ flexShrink: 0, marginLeft: '0' }}> {/* 去除左边距 */}
            <img
              src="https://www.xpj00000.vip/indexImg/icon_robot.6a2f7f3b.png_.webp"
              alt="客服机器人"
              style={{
                width: '90px',
                height: '90px',
                display: 'block'
              }}
            />
          </div>
          <div style={{ flex: 1, paddingRight: '16px' }}> {/* 只在右侧添加内边距 */}
            <p style={{
              fontSize: '18px',
              color: '#fff',
              fontWeight: 600,
              marginBottom: '5px',
              margin: 0
            }}>
              Hi~有什么可以帮到您！
            </p>
            <span style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              24小时专属客服为您服务...
            </span>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{
        padding: 0,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          padding: '30px 16px 20px',
          borderRadius: '30px 30px 0 0',
          background: '#151A23',
          position: 'relative'
        }}>
          {/* 常见问题列表 */}
          <div style={{
            background: 'rgba(30, 40, 54, 0.4)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '18px',
              color: '#fff',
              fontWeight: 600,
              marginBottom: '15px',
              paddingLeft: 0
            }}>
              猜你想问
            </div>

            {faqList.map((faq, index) => (
              <section
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFaq(index);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  overflow: 'visible',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div style={{ padding: '15px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      flexShrink: 0,
                      fontSize: '16px',
                      color: '#ffc53e',
                      fontWeight: 600,
                      marginRight: '8px'
                    }}>
                      {index + 1}.
                    </div>
                    <div style={{
                      flex: 1,
                      fontSize: '15px',
                      color: '#fff'
                    }}>
                      {faq.question}
                    </div>
                    <img
                      src="https://www.xpj00000.vip/indexImg/icon-arrow.6cf8a77d.png"
                      alt="arrow"
                      style={{
                        width: '12px',
                        height: '12px',
                        flexShrink: 0,
                        transition: 'transform 0.3s',
                        filter: 'brightness(0) invert(1)',
                        transform: faq.expanded ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    />
                  </div>
                  {faq.expanded && (
                    <div
                      style={{
                        marginTop: '15px',
                        paddingTop: '15px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: 1.8,
                        display: 'block',
                        visibility: 'visible',
                        opacity: 1
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* 服务选项 - 在线客服卡片 */}
          <div style={{ marginTop: '30px' }}>
            <div
              onClick={openOnlineService}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))',
                borderRadius: '12px',
                border: '1px solid rgba(255, 197, 62, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '16px',
                color: '#fff',
                fontWeight: 500
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.15), rgba(255, 197, 62, 0.08))';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 197, 62, 0.1), rgba(255, 197, 62, 0.05))';
              }}
            >
              <img
                src="https://www.xpj00000.vip/indexImg/icon_service.6b1fddf8.png"
                alt="在线客服"
                style={{ width: '32px', height: '32px', flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>24小时网页在线客服</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

