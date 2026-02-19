import { useEffect, useState } from 'react';


const formatNumber = (num: number): string => {
    num = Number(num);
    if (Number.isInteger(num)) {
        return num + '.00';
    }
    const parts = num.toString().split('.');
    if (parts.length === 1) {
        return parts[0] + '.00';
    }
    if (parts[1].length === 1) {
        return parts[0] + '.' + parts[1] + '0';
    }
    return num.toFixed(2);
};
/**
 * 根据指定位数获取数值（整数位从左到右0开始，小数位从左到右-1开始）
 * @param num 目标数字（保留两位小数）
 * @param position 位置索引（整数位：0,1,2...；小数位：-1,-2...）
 * @returns 对应位置的数值（无效位置返回0）
 */

const getDigitByPosition = (num: number, position: number): number => {
  // 确保数字保留两位小数（处理精度问题）
  const fixedNum = Math.round(num * 100) / 100;
  const numStr = fixedNum.toFixed(2); // 格式化为 "xxxx.xx"
  
  // 拆分整数和小数部分
  const [integerPart, decimalPart] = numStr.split('.');
  const reversedInteger = integerPart.split('').reverse(); // 整数部分反转（个位→索引0）
  const decimalDigits = decimalPart.split(''); // 小数部分（十分位→索引0，百分位→索引1）
  
  // 计算目标索引：
  // - 整数位（position≥0）：直接使用position作为反转后整数数组的索引
  // - 小数位（position<0）：小数部分索引 = -position - 1（如-1→0，-2→1）
  if (position >= 0) {
    return position < reversedInteger.length ? Number(reversedInteger[position]) : 0;
  } else {
    const decimalIndex = -position - 1;
    return decimalIndex < decimalDigits.length ? Number(decimalDigits[decimalIndex]) : 0;
  }
};

interface ScrollNumberProps {
  digit: number;
  delay: number;
  delayChange: number;
}

function ScrollNumber({ digit, delay, delayChange }: ScrollNumberProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimating(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="item-num">
      <div className="border">
        <div
          className="scroll-num num"
          style={
            {
              '--i': digit,
              '--delay': delay,
              '--delayChange': delayChange,
            } as React.CSSProperties
          }
        >
          <ul className={isAnimating ? 'animate' : ''}>
            <li>0</li>
            <li>1</li>
            <li>2</li>
            <li>3</li>
            <li>4</li>
            <li>5</li>
            <li>6</li>
            <li>7</li>
            <li>8</li>
            <li>9</li>
            <li>0</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



export function JackpotPool() {
  // 显示的数字：376,435.87
  const [pajiang, setPajiang] = useState(376435.87);
 
   useEffect(() => {
     const timer = setInterval(() => {
       setPajiang(prevCount => prevCount + 4514.12);
     }, 3000);
     return () => clearInterval(timer);
   }, []);
   useEffect(() => {
     const timer = setInterval(() => {
       setPajiang(prevCount => prevCount - 2541.01);
     }, 2000);
     return () => clearInterval(timer);
   }, []);

  return (
    <>
      <style>{`
        .jackpot-pool {
          margin-bottom: 0;
        }

        .jackpot-pool .pool {
          width: 100%;
          min-height: 60px;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          box-sizing: border-box;
          padding: 10px 15px 10px 100px;
        }

        .jackpot-pool .pool-item-box {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          flex-wrap: nowrap;
        }

        .jackpot-pool .item-num {
          width: 18px;
          height: 24px;
          margin-right: 1.5px;
          display: flex;
          justify-content: center;
          overflow: hidden;
          border-radius: 3px;
          box-shadow: none;
          position: relative;
          flex-shrink: 0;
        }

        .jackpot-pool .item-num .border {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: row;
          background: linear-gradient(180deg, rgba(252, 26, 25, 0.251) 0%, rgba(252, 26, 25, 0));
          border-radius: 3px;
          width: 100%;
          height: 100%;
        }

        .jackpot-pool .item-num .border .num {
          width: 16px;
          height: 22px;
          background: linear-gradient(348.33deg, #151a18 8.56%, #411b25 91.44%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .jackpot-pool .item-num.quotes {
          width: 8px;
          background: none;
          box-shadow: none;
          font-weight: 700;
          color: #e9bf6e;
          font-size: 28px;
          align-items: flex-end;
        }

        .jackpot-pool .item-num .quotes {
          font-family: DINAlternate-Bold;
          transform: translateY(2px);
        }

        .jackpot-pool .scroll-num {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .jackpot-pool .scroll-num ul {
          transform: translateY(calc(var(--i) * -22px));
          transition: transform 1s ease-out;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .jackpot-pool .scroll-num ul.animate {
          animation: bounce-in-down 1s calc(var(--delay) * 0.3s) forwards;
        }

        .jackpot-pool .scroll-num li {
          font-family: DINAlternate-Bold, Arial, sans-serif;
          background-image: linear-gradient(172.57deg, #ffb55e, #fff);
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          text-align: center;
          border-radius: 3px;
          font-size: 18px;
          line-height: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes bounce-in-down {
          0% {
            transform: translateY(calc(var(--i) * -22px - 15px));
          }
          25% {
            transform: translateY(calc(var(--i) * -22px + 7px));
          }
          50% {
            transform: translateY(calc(var(--i) * -22px - 2px));
          }
          70% {
            transform: translateY(calc(var(--i) * -22px + 1.5px));
          }
          85% {
            transform: translateY(calc(var(--i) * -22px - 0.7px));
          }
          100% {
            transform: translateY(calc(var(--i) * -22px));
          }
        }

        .jackpot-pool .money {
          color: #da9361;
          font-family: DINAlternate-Bold, Arial, sans-serif;
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
          margin-left: 6px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="jackpot-pool w-full" style={{ position: 'relative', zIndex: 2 }}>
        <div
          className="pool"
          style={{
            backgroundImage: 'url(https://www.xpj00000.vip/indexImg/homeBg.f7067038.webp)',
          }}
        >
          <div className="pool-item-box">
            {/* 百位 - 静态 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), 5)}
                  </span>
                </div>
              </div>
            </div>
            {/* 十位 - 静态 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), 4)}
                  </span>
                </div>
              </div>
            </div>
            {/* 个位 - 静态 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), 3)}
                  </span>
                </div>
              </div>
            </div>

            {/* 逗号 */}
            <div className="item-num quotes">
              <span className="quotes">,</span>
            </div>

            {/* 千位 - 滚动 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), 2)}
                  </span>
                </div>
              </div>
            </div>
            {/* 百位 - 滚动 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), 1)}
                  </span>
                </div>
              </div>
            </div>
            {/* 十位 - 滚动 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* 小数点 */}
            <div className="item-num quotes">
              <span className="quotes">.</span>
            </div>

            {/* 小数第一位 - 静态 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), -1)}
                  </span>
                </div>
              </div>
            </div>
            {/* 小数第二位 - 静态 */}
            <div className="item-num">
              <div className="border">
                <div className="num">
                  <span style={{ 
                    fontFamily: 'DINAlternate-Bold, Arial, sans-serif',
                    backgroundImage: 'linear-gradient(172.57deg, #ffb55e, #fff)',
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    fontSize: '18px',
                  }}>
                    {getDigitByPosition(formatNumber(pajiang), -2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="money">$</div>
        </div>
      </div>
    </>
  );
}