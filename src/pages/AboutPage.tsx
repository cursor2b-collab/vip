/**
 * 关于我们页面
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
export default function AboutPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
  return (
    <>
        {/* 添加动画样式 */}
        <style>{`
        
            .aboutNew {
                font-size: 13px;
                color: #c3c3c3;
                background: #282828
            }

            .aboutNew h1 {
                font-size: 25px;
                color: #fff
            }

            .aboutNew .sect1 {
                position: relative;
                display: block;
                width: 100%;
                height: 280px;
            }

            .aboutNew .sect1 .box {
                position: absolute;
                right: 0;
                bottom: 0;
                left: 0;
                display: block;
                margin: 0 15px;
                background: rgba(21,21,21,.8);
                border-radius: 8px
            }

            .aboutNew .sect1 .box .detail {
                padding: 40px 15px;
                font-size: 13px;
                color: #c3c3c3
            }

            .aboutNew .sect1 .box .detail p {
                font-size: 13px;
                line-height: 22px;
                color: #c3c3c3
            }

            .aboutNew .sect1 .box .detail p span {
                color: #fff
            }

            .aboutNew .sect1 .box h1 {
                position: relative;
                display: block;
                padding: 20px 0
            }

            .aboutNew .sect1 .box h1:before {
                position: absolute;
                top: 0;
                left: 0;
                width: 44px;
                height: 1px;
                content: "";
                background: #cca352
            }

            .aboutNew .sect2 {
                padding: 50px 0 0 0
            }

            .aboutNew .sect2 h1 {
                display: block;
                padding: 15px
            }

            .aboutNew .sect2 p {
                display: block;
                padding: 0 15px;
                font-size: 13px;
                line-height: 22px;
                color: #c3c3c3
            }

            .aboutNew .sect2 .gameList {
                padding: 15px 0 15px 15px;
                margin: 0 auto
            }

            .aboutNew .sect2 .gameList .gthmb {
                display: table;
                padding: 0;
                margin: 0;
                border-collapse: collapse
            }

            .aboutNew .sect2 .gameList .gthmb .item {
                display: table-cell;
                width: 33.33%;
                padding-right: 15px;
                padding-bottom: 15px
            }

            .aboutNew .sect2 .gameList .gthmb .item .img-loading {
                display: block;
                width: 100%
            }

            .aboutNew .sect3 {
                padding: 20px 15px 0 15px
            }

            .aboutNew .sect3 h1 {
                display: block;
                padding: 15px 0
            }

            .aboutNew .sect3 .reportList .item {
                padding: 15px;
                margin-bottom: 15px;
                background: #151515;
                border-radius: 8px
            }

            .aboutNew .sect3 .reportList .item h2 {
                display: block;
                padding: 15px 0;
                font-size: 22px;
                color: #cca352
            }

            .aboutNew .sect3 .reportList .item h2 .link {
                float: right;
                font-size: 14px;
                color: #cca352
            }

            .aboutNew .sect3 .reportList .item p {
                font-size: 13px;
                line-height: 22px;
                color: #fff
            }

            .aboutNew .sect3 .reportList .item p .dots {
                padding: 15px 0;
                font-size: 20px;
                color: #cca352
            }

            .aboutNew .sect4 {
                padding: 50px 0 0 0
            }

            .aboutNew .sect4 .banner {
                display: block
            }

            .aboutNew .sect4 .banner .img-loading {
                display: block;
                width: 100%;
                height: auto
            }

            .aboutNew .sect4 p {
                display: block;
                padding: 15px;
                font-size: 13px;
                color: #c3c3c3
            }

            .aboutNew .sect4 .btnCon {
                display: block;
                padding: 15px
            }

            .aboutNew .sect4 .btnCon .btn {
                display: block;
                height: 34px;
                margin: 0 40px;
                line-height: 34px;
                color: #cca352;
                text-align: center;
                border: 1px solid #cca352;
                border-radius: 4px
            }

            .aboutNew .sect5 {
                padding: 40px 15px;
                background: var(--about-new-bg2) bottom no-repeat;
                background-size: 100% auto
            }

            .aboutNew .sect5 h1 {
                display: block;
                padding: 15px 0
            }

            .aboutNew .sect5 p {
                display: block;
                color: #c3c3c3
            }

            .aboutNew .sect5 p span {
                color: #fff
            }

            .aboutNew .sect5 .shareholderList {
                display: block;
                padding: 15px 0 0 0
            }

            .aboutNew .sect5 .shareholderList p {
                margin-bottom: 15px
            }

            .aboutNew .sect5 .shareholderList i {
                display: inline-block;
                width: 40px;
                height: 30px;
                vertical-align: middle
            }

            .aboutNew .sect5 .shareholderList i.orb1 {
                background: url('/images/week/about1.avif') 0 no-repeat;
                background-size: 28px auto
            }

            .aboutNew .sect5 .shareholderList i.orb2 {
                background: url('/images/week/about2.avif') 0 no-repeat;
                background-size: 28px auto
            }

            .aboutNew .sect5 .shareholderList i.orb3 {
                background: url('/images/week/about3.avif') 0 no-repeat;
                background-size: 28px auto
            }

            .aboutNew .sect5 .shareholderList i.orb4 {
                background: url('/images/week/about4.avif') 0 no-repeat;
                background-size: 28px auto
            }

            .aboutNew .sect5 .shareholderList i.orb5 {
                background: url('/images/week/about5.avif') 0 no-repeat;
                background-size: 28px auto
            }

            .aboutNew .sect5 .shareholderList i.orb6 {
                background: url('/images/week/about6.avif') 0 no-repeat;
                background-size: 28px auto
            }

            .aboutNew .sect5 .btnCon {
                display: block;
                padding: 15px
            }

            .aboutNew .sect5 .btnCon .btn {
                display: block;
                height: 34px;
                margin: 0 40px;
                line-height: 34px;
                color: #cca352;
                text-align: center;
                border: 1px solid #cca352;
                border-radius: 4px
            }

            .aboutNew .sect6 {
                padding: 50px 0 40px 0
            }

            .aboutNew .sect6 h1 {
                display: block;
                padding: 15px
            }

            .aboutNew .sect6 p {
                display: block;
                padding: 0 15px;
                font-size: 13px;
                line-height: 22px;
                color: #c3c3c3
            }

            .aboutNew .sect6 .promoList {
                padding: 0 0 15px 15px;
                margin: 0 auto
            }

            .aboutNew .sect6 .promoList .gthmb {
                padding: 0;
                margin: 0
            }

            .aboutNew .sect6 .promoList .gthmb .item {
                display: inline-block;
                width: 50%;
                padding-right: 15px;
                padding-bottom: 15px;
                vertical-align: top;
                position: relative
            }

            .aboutNew .sect6 .promoList .gthmb .item .text {
                width: 100%;
                font-size: .12rem;
                color: #fff;
                position: absolute;
                left: .1rem;
                bottom: .25rem;
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-orient: vertical;
                -webkit-box-direction: normal;
                -ms-flex-direction: column;
                flex-direction: column
            }

            .aboutNew .sect6 .promoList .gthmb .item .img-loading {
                width: 1.65rem;
                height: 1.05rem
            }

            .aboutNew .sect6 .promoList .gthmb .item .promo-1 {
                border-radius: .08rem
            }

            .aboutNew .sect6 .btnCon {
                display: block;
                padding: 15px
            }

            .aboutNew .sect6 .btnCon .btn {
                display: block;
                height: 34px;
                margin: 0 40px;
                line-height: 34px;
                color: #cca352;
                text-align: center;
                border: 1px solid #cca352;
                border-radius: 4px
            }

            .aboutNew .sect7 {
                padding: 40px 15px;
                background: #1e1e1e
            }

            .aboutNew .sect7 h1 {
                display: block;
                padding: 15px 0
            }

            .aboutNew .sect7 p {
                display: block;
                margin-bottom: 20px;
                font-size: 13px;
                line-height: 22px;
                color: #c3c3c3
            }

            .aboutNew .sect7 .certCon {
                display: block;
                padding: 30px 0
            }

            .aboutNew .sect7 .certCon .img-loading {
                display: block;
                width: 225px;
                margin: 0 auto
            }

            .aboutNew .sect7 .certCon .zoomLink {
                display: block;
                padding: 15px 0;
                font-size: 14px;
                color: #cca352;
                text-align: center
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
                    <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('aboutTitle')}</h2>
                </div>

                <div style={{ padding: '20px' }}>
                    
                    <div className="aboutNew">
                        <div className="sect1">
                            <div className="box">
                                <div className="detail">
                                    <h1 >B77娱乐优势</h1>
                                    <p >单日提款高达<span >2,000万</span></p>
                                    <p >随时洗码1秒到账</p>
                                    <p >单笔下注金额为最高<span >500万</span></p>
                                    <p >支持<span >USDT、BTC</span>多币种到账</p>
                                    <p >澳门、菲律宾各大<span >赌场出款</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="sect2">
                            <h1>众多游戏平台</h1>
                            <p>我们提供丰富游戏项目：百家乐、龙宝、骰宝、21点、体育竞技、轮盘、炸金花、三公、温州牌九、牛牛、德州扑克等</p>
                            <div className="gameList">
                                <div className="gthmb">
                                    <div className="item">
                                        <div className="img-loading finished">
                                            <img className="w-100 loaded" src="/images/week/game1.png" style={{ borderRadius: '0px' }} />
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="img-loading finished">
                                            <img className="w-100 loaded" src="/images/week/game2.png" style={{ borderRadius: '0px' }} />
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="img-loading finished">
                                            <img className="w-100 loaded" src="/images/week/game3.png" style={{ borderRadius: '0px' }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="gthmb">
                                    <div className="item">
                                        <div className="img-loading finished">
                                            <img className="w-100 loaded" src="/images/week/game4.png" style={{ borderRadius: '0px' }} />
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="img-loading finished">
                                            <img className="w-100 loaded" src="/images/week/game5.png" style={{ borderRadius: '0px' }} />
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="img-loading finished">
                                            <img className="w-100 loaded" src="/images/week/game6.png" style={{ borderRadius: '0px' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sect3">
                            <h1 >年度报告</h1>
                            <div className="reportList">
                                <div className="item">
                                    <h2 > 2018 + <span className="link"></span>
                                        <div className="clear"></div>
                                    </h2>
                                    <p >全年成交2089亿</p>
                                    <p >新增会员注册用户532.64万人</p>
                                    <p >全年送出优惠高达12.14亿元</p>
                                    <p ><span className="dots">• • •</span></p>
                                </div>
                                <div className="item">
                                    <h2 > 2017 + <span className="link"></span>
                                    <div className="clear"></div>
                                    </h2>
                                    <p >全年成交1971.82亿</p>
                                    <p >新增会员注册用户323.05万人</p>
                                    <p >全年送出优惠高达12.1亿元</p>
                                    <p ><span className="dots">• • •</span></p>
                                </div>
                                <div className="item">
                                    <h2 > 2016 + <span className="link"></span>
                                        <div className="clear"></div>
                                    </h2>
                                    <p >全年成交1507.61亿</p>
                                    <p >新增会员数较2015年增长159.63%</p>
                                    <p >全年送出优惠高达7.9亿元</p>
                                    <p ><span className="dots">• • •</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="sect4">
                            <div className="banner">
                                <div className="img-loading finished">
                                    <img className="w-100 loaded" src="/images/week/banner.b89efc32.jpg" style={{ borderRadius: '0px' }}/>
                                </div>
                            </div>
                            <p >现场参观豪华游艇主题party，邀您感受菲律宾的热情</p>
                            <div className="btnCon"><span className="btn">了解详情</span></div>
                        </div>
                        <div className="sect5">
                            <h1 >全民俱乐部</h1>
                            <p >每月8/18/28爽领分红</p>
                            <div className="shareholderList">
                            <p ><i className="orb1"></i><span >专属经理</span> 一对一服务 </p>
                            <p ><i className="orb2"></i><span >专属域名</span> 私人定制专属通道
                            </p>
                            <p ><i className="orb3"></i><span >月月分红</span> 最高可享200,000股
                            </p>
                            <p ><i className="orb4"></i><span >账号回购</span>
                                B77官方保底账号回购1,400,000元 </p>
                            <p ><i className="orb5"></i><span >晋级礼金</span>
                                累计最高可享6,015,500元 </p>
                            <p ><i className="orb6"></i><span >免息贷款</span>
                                最高可享1,400,000元 </p>
                            </div>
                            <div className="btnCon"><span className="btn">查看更多</span></div>
                        </div>
                        <div style={{ height:'40px' }}></div>
                    </div>

                </div>

            </div>
        </div>
  
    </>

  );
}

