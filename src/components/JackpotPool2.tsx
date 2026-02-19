import React,{ useEffect, useState } from 'react';


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

export function JackpotPool2() {
  // 显示的数字：376,435.87
  const [pajiang, setPajiang] = useState(1346942.48);
  const [ptjiang, setPtjiang] = useState(279302266.96);

  useEffect(() => {
    const timer = setInterval(() => {
      setPajiang(prevCount => prevCount + 1748.04);
    }, 6000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setPajiang(prevCount => prevCount - 542.01);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
//--------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setPtjiang(prevCount => prevCount + 6574.09);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setPtjiang(prevCount => prevCount - 1254.01);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        .bonus-pool {
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            margin: 10px 0px;
        }
        .game-pool-bouns-home {
            width: 178px;
            height: 62px;
            background-image: url('/images/week/6r4xq-rrdvx.png');
            background-repeat: no-repeat;
            background-size: 100%;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            
        }
        .game-pool-bouns-home p {
            color: #ff7e67;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .game-pool-bouns-home .bonusAmount {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: end;
            -ms-flex-align: end;
            align-items: flex-end
        }

        .game-pool-bouns-home .bonusAmount span {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            width: 11px;
            height: 16px;
            padding-top: 1px;
            background: -webkit-gradient(linear,left top,left bottom,from(rgba(135,191,255,.1490196078)),to(rgba(135,191,255,.3490196078)))!important;
            background: linear-gradient(180deg,rgba(135,191,255,.1490196078),rgba(135,191,255,.3490196078))!important;
            border-radius: 2px !important;
            color: #ffcb4c;
            font-family: DIN Alternate;
            font-weight: 700;
            font-size: 14px;
        }

        .game-pool-bouns-home .bonusAmount .comma,.game-pool-bouns-home .bonusAmount .period {
            width: 2px !important;
            height: 4px !important;
            background-image: url('/images/week/comma.93fb21d1.png')!important;
            background-size: 100% 100%!important;
            background-repeat: no-repeat!important
        }

        .game-pool-bouns-home .bonusAmount .period {
            width: 2px !important;
            height: 2px !important;
            background-image: url('/images/week/period.909878ca.png')!important
        }

        .game-pool-bouns-home:last-of-type {
            background-image: url('/images/week/6r4xq-rrdvx.png');
            margin-left: 10px;
        }

        .game-pool-bouns-home:last-of-type p {
            color: #6ea8ff;
        }
            
        .bonusNumber-span {
            background: #000;border-radius: 4px;margin:0px 1px;
        }
      `}</style>

        <div className="bonus-pool">
            <div className="game-pool-bouns-home">
                <p>PA电游奖金池(元)</p>
                <div id="jackpot-ag" className="bonusAmount jackpot-ag">
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), 6)}</span>
                    <span className="comma"></span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), 5)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), 4)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), 3)}</span>
                    <span className="comma"></span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), 2)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), 1)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), 0)}</span>
                    <span className="period"></span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), -1)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(pajiang), -2)}</span>
                </div>
            </div>
            <div  className="game-pool-bouns-home">
                <p>PG电游奖金池(元)</p>
                <div id="jackpot-pt" className="bonusAmount jackpot-pt">
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 8)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 7)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 6)}</span>
                    <span className="comma"></span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 5)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 4)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 3)}</span>
                    <span className="comma"></span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 2)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 1)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), 0)}</span>
                    <span className="period"></span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), -1)}</span>
                    <span className="bonusNumber-span">{getDigitByPosition(formatNumber(ptjiang), -2)}</span>
                </div>
            </div>
        </div>
    </>
  );
}



