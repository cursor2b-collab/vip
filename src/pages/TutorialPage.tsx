/**
 * 新手教程页面
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
export default function TutorialPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [selectedClass, setSelectedClass] = useState('default');

    const handleClick = (className: string) => {
        if (selectedClass === className){
            setSelectedClass('default');
        } else {
            setSelectedClass(className);
        }
    };


  return (
    <>
        {/* 添加动画样式 */}
        <style>{`
            .faq {
                position: absolute;
                top: 50px;
                right: 0;
                bottom: 0;
                left: 0;
                padding: 20px 0
            }

            .faq .title {
                padding: 0 0 0 15px;
                background: #141414
            }

            .faq .title h4 {
                height: 46px;
                font-size: 16px;
                line-height: 46px;
                color: #999
            }

            .faq ul li .t {
                position: relative;
                padding: 0 15px 0 15px;
                line-height: 55px;
                background: #222
            }

            .faq ul li .t h4 {
                height: 55px;
                font-size: 16px;
                color: #e0e0e0;
                border-bottom: 1px solid rgba(58,58,58,.5)
            }

            .faq ul li .t i {
                position: absolute;
                top: 20.5px;
                right: 15px;
                display: block;
                width: 7px;
                height: 14px;
                background: url('/images/week/xsjc-1.avif') no-repeat;
                background-size: 100% 100%
            }

            .faq ul li .c {
                padding: 13px 15px 15px 15px;
                line-height: 24px;
                word-break: break-all;
                background: #111
            }
            .faq ul li .c1 {
                display: none;
            }

            .faq ul li .c .neirong {
                font-family: PingFangSC-Regular,Droidsansfallback,DroidSans,Helvetica,微软雅黑,serif;
                font-size: 14px;
                color: #ccc
            }

            .faq ul li .c .neirong span {
                text-decoration: underline
            }

            .faq ul li.active .t i {
                -webkit-transform: rotate(270deg);
                transform: rotate(270deg)
            }

            .faq .accordion-enter-active {
                -webkit-transition-timing-function: ease-in;
                transition-timing-function: ease-in;
                -webkit-transition-duration: .3s;
                transition-duration: .3s
            }

            .faq .accordion-leave-active {
                -webkit-transition-timing-function: cubic-bezier(0,1,.5,1);
                transition-timing-function: cubic-bezier(0,1,.5,1);
                -webkit-transition-duration: .3s;
                transition-duration: .3s
            }

            .faq .accordion-enter-to,.faq .accordion-leave {
                max-height: 100px;
                overflow: hidden
            }

            .faq .accordion-enter,.faq .accordion-leave-to {
                max-height: 0;
                overflow: hidden
            }
        `}</style>

        <div style={{ 
            minHeight: '100vh', 
            background: '#0C1017', 
            color: '#fff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
            }}>
            {/* PC端居中容器 */}
            <div style={{
                width: '100%',
                maxWidth: '430px',
                position: 'relative',
                boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
                minHeight: '100vh',
                background: '#0C1017'
            }}>
                {/* 返回按钮 */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <img 
                        onClick={() => navigate(-1)} 
                        src="https://www.xpj00000.vip/indexImg/icon_header_arrow.f02628bc.png" 
                        alt="返回"
                        style={{ 
                            width: '24px', 
                            height: '24px', 
                            cursor: 'pointer',
                            position: 'absolute',
                            left: '20px'
                        }} 
                    />
                    <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('tutorialTitle')}</h2>
                </div>

                <div style={{ padding: '20px' }}>
                    
                    <div className="faq">
                        <div className="row">
                            <div className="title">
                                <h4>账号类问题</h4>
                            </div>
                            <ul>
                                <li className={selectedClass === '1' ? 'active' : ''} onClick={() => handleClick('1')} >
                                    <div className="t">
                                        <h4 >如何注册？ <i></i></h4>
                                    </div>
                                    <div className={selectedClass === '1' ? 'c' : 'c1'}>
                                        <div className="neirong">开户方式有两种：</div>
                                        <div className="neirong">1、请点击网站首页“<span onClick={() => navigate('/register')}>免费开户</span> ”按钮，按照界面所规定的填写内容进行自助开户。</div>
                                        <div className="neirong">2、联系<span onClick={() => navigate('/service')}>在线客服</span>提供您的联系电话和取款银行卡姓名即可开出游戏账号 。</div>
                                    </div>
                                </li>
                                <li className={selectedClass === '2' ? 'active' : ''} onClick={() => handleClick('2')}>
                                    <div className="t">
                                        <h4 >忘记密码怎么办？ <i ></i></h4>
                                    </div>
                                    <div className={selectedClass === '2' ? 'c' : 'c1'}>
                                        <div className="neirong">(1) 您可以自行找回密码：于登录页面的密码左下方点击[忘记账号、密码？]，选择[我忘记密码了]，依据提示自助找回密码即可</div>
                                        <div className="neirong">(2) 您可以联系24小时<span >在线客服</span>人员，通过客服人员<span
                                            >免费电话</span>给您协助找回您的账号密码。 </div>
                                    </div>
                                </li>
                                <li className={selectedClass === '3' ? 'active' : ''} onClick={() => handleClick('3')}>
                                    <div className="t">
                                        <h4 >怎么充币？ <i ></i></h4>
                                    </div>
                                    <div className={selectedClass === '3' ? 'c' : 'c1'}>
                                        <div className="neirong">
                                        登录账号后进入充币页面，选择您要的充币方式并输入金额，根据页面提示进行扫码转币或者人民币买币，交易完成后充值金额将会自动存入您的网站账户中。更详细的操作可以到首页上的"数字币充提指南"查看哦。
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="row">
                            <div className="title">
                                <h4 >游戏类问题</h4>
                            </div>
                            <ul >
                                <li className={selectedClass === '4' ? 'active' : ''} onClick={() => handleClick('4')}>
                                    <div className="t">
                                        <h4 >游戏结束后如何提币？ <i ></i></h4>
                                    </div>
                                    <div className={selectedClass === '4' ? 'c' : 'c1'}>
                                        <div className="neirong">
                                            登录账号后进入提币页面，输入提币金额（第一次提币须绑定钱包）后选择提币钱包，确认提币后约30分钟内转入您的钱包。更详细的操作可以到首页上的"数字币充提指南"查看哦。
                                        </div>
                                    </div>
                                </li>
                                <li className={selectedClass === '5' ? 'active' : ''} onClick={() => handleClick('5')}>
                                    <div className="t">
                                        <h4>提币到账如何变现？ <i ></i></h4>
                                    </div>
                                    <div className={selectedClass === '5' ? 'c' : 'c1'}>
                                        <div className="neirong">
                                            登录账号后进入提币页面，点选"卖币变现"进入后选择您要的交易所，输入卖币数量进行提交，使用您的钱包向交易所提供的转币地址进行转账，交易成功后变现的金额会自动转入您提供的指定账户中。更详细的操作可以到首页的"数字币充提指南"查看哦。
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>

            </div>
        </div>
  
    </>

  );
}

