/**
 * 天生赢家 一触即发 - 新用户三档存送活动页
 * 路径: /promotions/threegifts
 * 样式按原版 HTML，rem 基准 100px（本页根字体 100px）
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';
import styles from './ThreeGiftsPage.module.css';

const BG_URL = 'https://ik.imagekit.io/ixcx8adghm/game/blob.png?updatedAt=1770588545611';
const BG_ACTIVITY_URL = 'https://ik.imagekit.io/ixcx8adghm/game/blo.png?updatedAt=1770588879830';
const DEPOSIT_BTN_URL = 'https://ik.imagekit.io/ixcx8adghm/game/image(7).png';
const GIFT_LEVEL2 = 'https://ik.imagekit.io/ixcx8adghm/game/5f3537.avif?updatedAt=1770588880341';
const GIFT_LEVEL1 = 'https://ik.imagekit.io/ixcx8adghm/game/87.avif?updatedAt=1770588879796';
const GIFT_LEVEL1_TOP = 'https://ik.imagekit.io/ixcx8adghm/game/893369.avif?updatedAt=1770588879624';
const PERCENT_30 = 'https://ik.imagekit.io/ixcx8adghm/game/9.avif?updatedAt=1770588879658';
const PERCENT_40 = 'https://ik.imagekit.io/ixcx8adghm/game/8d.avif?updatedAt=1770588880323';
const PERCENT_10 = 'https://ik.imagekit.io/ixcx8adghm/game/71.avif?updatedAt=1770588879133';
const BG_RULES_URL = 'https://ik.imagekit.io/ixcx8adghm/game/i.png';

const MIN_LOADING_MS = 500;

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // 失败也继续，不阻塞展示
    img.src = src;
  });
}

export default function ThreeGiftsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const start = Date.now();
    const urls = [
      BG_URL,
      BG_ACTIVITY_URL,
      DEPOSIT_BTN_URL,
      GIFT_LEVEL2,
      GIFT_LEVEL1,
      GIFT_LEVEL1_TOP,
      PERCENT_30,
      PERCENT_40,
      PERCENT_10,
      BG_RULES_URL,
    ];
    Promise.all(urls.map(preloadImage)).then(() => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      if (remaining > 0) {
        timeoutId = setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (loading) return <PageLoader />;

  return (
    <>
      {/* PC 端全视口背景层，铺满网页 */}
      <div
        className={styles.pageBg}
        style={{
          backgroundImage: `url(${BG_URL})`,
        }}
        aria-hidden="true"
      />
      <div
        className={styles.root}
        style={{
          backgroundImage: `url(${BG_URL})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 50px', /* 从页头(50px)下方开始，避免被遮挡 */
          backgroundSize: '100% auto',
        }}
      >
      {/* 页头：使用 px，不参与 rem 缩放 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#141414',
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 15,
          paddingRight: 15,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            position: 'relative',
            zIndex: 2,
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            padding: 8,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 36,
            minHeight: 36,
          }}
          aria-label="返回"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
            margin: 0,
            pointerEvents: 'none',
          }}
        >
          新用户专享超高优惠
        </h1>
        <div style={{ width: 36 }} />
      </header>

      {/* 主内容：缩放根使 1em = 100px，与设计稿一致 */}
        <div className={styles.scaleRoot}>
        <div className={styles.threeGifts}>
          <div className={styles.promoList}>
            <div
              className={`${styles.promoMotivation} ${styles.ACTIVITY}`}
              style={{ backgroundImage: `url(${BG_ACTIVITY_URL})` }}
            >
              <div className={styles.slogan}>首次存款多存多送，三档择高发放.</div>
              <div className={styles.giftIntroduce}>
                {/* 第一档 基础档 30% */}
                <div className={styles.giftItem}>
                  <div className={styles.giftImg}>
                    <img src={GIFT_LEVEL1_TOP} alt="基础档" />
                  </div>
                  <div className={styles.percentWrap}>
                    <img src={PERCENT_30} alt="30%" />
                  </div>
                </div>
                {/* 第二档 进阶档 40% */}
                <div className={styles.giftItem}>
                  <div className={styles.giftImg}>
                    <img src={GIFT_LEVEL2} alt="进阶档" />
                  </div>
                  <div className={styles.percentWrap}>
                    <img src={PERCENT_40} alt="40%" />
                  </div>
                </div>
                {/* 第三档 尊贵档 10% */}
                <div className={styles.giftItem}>
                  <div className={styles.giftImg}>
                    <img src={GIFT_LEVEL1} alt="尊贵档" />
                  </div>
                  <div className={styles.percentWrap}>
                    <img src={PERCENT_10} alt="10%" />
                  </div>
                </div>
                <div className={styles.btnGroupWrap} />
              </div>
            </div>
          </div>

          {/* 活动卡片下方：规则图 + 规则文案 */}
          <div
            className={styles.threeGiftsRule}
            style={{ backgroundImage: `url(${BG_RULES_URL})` }}
          >
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <div className={styles.num}></div>
                <div>
                  1 . 本活动针对2025年10月1日后注册未存款用户可享受，支持USDT钱包参与；
                  <span className={styles.qaWrap}>
                    <img className={styles.qaIcon} src="https://91a2c0front.airuig.com/cdn/91a2c0FM/static/img/icon_qa.27fdfdfe.png" alt="" />
                    <span className={styles.qaContent}>
                      USDT钱包参与按照筹码比例7进行计算档次及奖品派发；存款金额为用户单笔存款到账金额，如特殊存款金额需拆分存款，需额外咨询官网客服。
                    </span>
                  </span>
                </div>
              </li>
              <li className={styles.listItem}>
                <div className={styles.num}></div>
                <div>
                  2 . 本活动无需报名，不与其他存送活动共享，完成首次存款即可参与，奖品领取有效期为存款后7日内，请存款后及时前往活动页面领取，过期作废；仅需8倍流水即可取款；
                  <span className={styles.qaWrap}>
                    <img className={styles.qaIcon} src="https://91a2c0front.airuig.com/cdn/91a2c0FM/static/img/icon_qa.27fdfdfe.png" alt="" />
                    <span className={styles.qaContent}>
                      取款流水要求:(本金+优惠)*8倍流水
                    </span>
                  </span>
                </div>
              </li>
              <li className={styles.listItem}>
                <div className={styles.num}></div>
                <div>
                  3 . 本活动只适用于拥有一个账户的玩家参与（相同姓名、电话号码、地址、邮箱、IP等），如发现会员以不正当方式投注，网站有权取消会员活动资格及所获奖励；
                </div>
              </li>
              <li className={styles.listItem}>
                <div className={styles.num}></div>
                <div>
                  4 . 为了避免对文字的理解差异，B77贵宾会保留对以上方案的解释权。
                </div>
              </li>
            </ul>
          </div>

          <div className={styles.btnGroupFixed}>
            <div className={styles.btnGroup}>
              <img src={DEPOSIT_BTN_URL} alt="" />
              <button type="button" onClick={() => navigate('/deposit')} aria-label="立即存款" />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
