/**
 * 新手教程页面
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
export default function AppDownloadPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    const handleClick = () => {
        window.location.href = 'https://www.baidu.com/';
    };

  return (
    <>
        {/* 添加动画样式 */}
        <style>{`
            
           .download {
                padding: 20px 0 90px;
                background: #141414
            }

            .download .row {
                margin-bottom: 15px
            }

            .download .row.teach {
                margin-top: .42rem
            }

            .download .br {
                display: block;
                width: 100%;
                height: 1px;
                margin: 14px auto;
                background: #353535
            }

            .row h3 {
                padding: 0 15px;
                margin-bottom: 12px;
                font-size: 16px;
                color: #fff
            }

            .row .item {
                padding: 14px 15px;
                background: #282828
            }

            .row .item .item-img {
                display: inline-block;
                -ms-flex-preferred-size: 66px;
                flex-basis: 66px;
                width: 66px;
                padding: 0;
                margin-right: 10px;
                vertical-align: middle
            }

            .row .item .item-img.rich .img-loading {
                border-radius: .12rem
            }

            .row .item .grup {
                position: relative;
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                padding: 14px 0
            }

            .row .item .grup+.grup {
                border-top: 1px solid #353535
            }

            .row .item .grup:first-child {
                padding-top: 0
            }

            .row .item .grup:last-child {
                padding-bottom: 0
            }

            .row .item .info {
                display: inline-block;
                -webkit-box-flex: 1;
                -ms-flex: 1;
                flex: 1;
                padding-right: 5px;
                vertical-align: middle
            }

            .row .item .info h3 {
                padding: 8px 0 0;
                margin-bottom: 5px;
                font-size: 15px;
                font-weight: 700;
                line-height: 22px;
                color: #fff
            }

            .row .item .info .conp {
                font-size: 12px;
                line-height: 18px;
                color: #ccc
            }

            .row .item .info .conp.txt2 {
                font-size: 11px;
                color: #999
            }

            .row .item .icon {
                position: relative;
                top: 0;
                display: inline-block;
                width: 15px;
                height: 18px;
                margin-right: 3px
            }

            .row .item .icon-ios {
                background: url('/images/week/xz2.avif') no-repeat;
                background-size: cover
            }

            .row .item .icon-android {
                background: url('/images/week/xz1.avif') no-repeat;
                background-size: cover
            }

            .row .item .download-btn {
                display: inline-block;
                width: 46px;
                height: 24px;
                margin: 0 0 0 5px;
                font-size: 12px;
                line-height: 24px;
                color: #cca352;
                text-align: center;
                border: 1px solid #c49b4f;
                border-radius: 4px
            }

            .row .item .item-btn {
                display: inline-block;
                width: 92px;
                text-align: right;
                white-space: nowrap;
                vertical-align: middle
            }

            .row .item-group {
                -ms-flex-pack: distribute;
                justify-content: space-around
            }

            .row .item-buttons,.row .item-group {
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-align: center;
                -ms-flex-align: center;
                align-items: center;
                width: 100%
            }

            .row .item-buttons {
                -webkit-box-pack: justify;
                -ms-flex-pack: justify;
                justify-content: space-between;
                padding: 0 15px 20px;
                background: #282828
            }

            .row .item-buttons .download-btn {
                -webkit-box-sizing: border-box;
                box-sizing: border-box;
                display: inline-block;
                -webkit-box-flex: 1;
                -ms-flex: 1;
                flex: 1;
                height: 28px;
                margin-right: 14px;
                font-size: 14px;
                line-height: 28px;
                color: #fff;
                text-align: center;
                background: #cca352;
                border-radius: 4px
            }

            .row .item-buttons .download-btn i {
                position: relative;
                top: 3px;
                display: inline-block;
                width: 16.5px;
                height: 16.5px;
                margin-right: 5px;
                background: var(--download-btn) no-repeat;
                background-size: 100% 100%
            }

            .row .item-buttons .download-btn.download-btn2 {
                margin-right: 0;
                color: #cca352;
                background: transparent;
                border: 1px solid #cca352
            }

            .row .item-buttons .download-btn.download-btn2 i {
                background: var(--download-btn2) no-repeat;
                background-size: 100% 100%
            }

            .alertContent .alert-content {
                position: relative;
                width: 270px;
                overflow: hidden;
                background-color: #fff;
                border-radius: 6px;
                -webkit-box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
                box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden
            }

            .alertContent .alert-content .alert-title {
                padding-top: 20px
            }

            .alertContent .alert-content .alert-title p {
                margin-bottom: 5px;
                font-size: 17px;
                font-weight: 700;
                line-height: normal;
                color: #000;
                text-align: center
            }

            .alertContent .alert-content .alert-body {
                padding: 0 35px 20px;
                border-bottom: 1px solid #b2b2b2
            }

            .alertContent .alert-content .alert-body p {
                font-size: 12px;
                line-height: 20px;
                color: #333;
                text-align: center
            }

            .alertContent .alert-content .alert-footer {
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex
            }

            .alertContent .alert-content .alert-footer .alertbtn {
                -webkit-box-flex: 1;
                -ms-flex: 1;
                flex: 1;
                height: 44px;
                font-size: 17px;
                line-height: 44px;
                color: #007aff;
                text-align: center;
                cursor: pointer;
                background-color: #fff;
                border: none;
                outline: none
            }

            .alertContent .alert-content .alert-footer .alertbtn:first-child {
                border-right: 1px solid #b2b2b2
            }

            .popDownloadBackdrop {
                position: fixed;
                top: 0;
                left: 0;
                z-index: 100;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,.8)
            }

            .popDownloadBackdrop .popDownload {
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                width: 298px;
                height: 200px;
                margin: auto;
                background: #fff;
                border: 1px solid #c79f5c;
                border-radius: 4px
            }

            .popDownloadBackdrop .popDownload .pop-close {
                position: absolute;
                top: -35px;
                right: 0;
                width: 26px;
                height: 35px;
                background: url(../../../../cdn/91a2c0FM/static/img/close.826ecfec.png) no-repeat;
                background-size: 100% 100%
            }

            .popDownloadBackdrop .popDownload .icon {
                position: absolute;
                top: -48px;
                right: 0;
                left: 0;
                width: 120px;
                height: 113px;
                margin: auto;
                background: url(../../../../cdn/91a2c0FM/static/img/icon1.ba1d830a.png) no-repeat;
                background-size: 100% 100%
            }

            .popDownloadBackdrop .popDownload .pop-c {
                padding: 70px 16px 0;
                text-align: center
            }

            .popDownloadBackdrop .popDownload .pop-c p {
                font-size: 16px;
                line-height: 22px;
                color: #666
            }

            .popDownloadBackdrop .popDownload .pop-c .pop-buttons {
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-align: center;
                -ms-flex-align: center;
                align-items: center;
                -webkit-box-pack: justify;
                -ms-flex-pack: justify;
                justify-content: space-between;
                width: 100%;
                margin-top: 24px
            }

            .popDownloadBackdrop .popDownload .pop-c .pop-buttons .pop-btn {
                position: relative;
                display: inline-block;
                width: 125px;
                height: 40px;
                font-size: 16px;
                line-height: 40px;
                text-align: center;
                border-radius: 3px
            }

            .popDownloadBackdrop .popDownload .pop-c .pop-buttons .pop-btn.pop-btn1 {
                width: 123px;
                height: 38px;
                line-height: 38px;
                color: #cca352;
                border: 1px solid #cca352
            }

            .popDownloadBackdrop .popDownload .pop-c .pop-buttons .pop-btn.pop-btn2 {
                color: #fff;
                text-shadow: 0 1px 1px rgba(50,22,0,.5);
                background: #ffd37c;
                background-image: linear-gradient(45deg,#ffd37c,#996b3d)
            }

            .popDownloadBackdrop .popDownload .pop-c .pop-buttons .pop-btn.pop-btn2 .tag {
                position: absolute;
                top: -1px;
                right: -1px;
                width: 32px;
                height: 32px;
                background: url(../../../../cdn/91a2c0FM/static/img/tag.206f0d89.png) no-repeat;
                background-size: 100% 100%
            }

            .exclusive {
                width: auto;
                height: 18px;
                margin-left: 6px;
                vertical-align: text-bottom
            }

            .appInstallTeach {
                color: #f9cb5c;
                font-size: 16px;
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
                    <h2 style={{ margin: 0, fontSize: '18px', flex: 1, textAlign: 'center' }}>{t('appDownloadTitle')}</h2>
                </div>

                <div style={{ padding: '0px' }}>
                    
                    <div className="container download">
      
                        <div className="row">
                            <div >
                                <h3 >APP下载</h3>
                                <ul className="item">
                                    <li className="grup">
                                        <div className="item-group">
                                            <div className="item-img">
                                                <div className="img-loading finished">
                                                    <img className="w-100 loaded" src="/images/week/teach.svg" style={{ borderRadius: '1px' }} />
                                                </div>
                                            </div>
                                            <div className="info">
                                                <h3 > B77娱乐全新手机APP </h3>
                                                <div className="conp">体验更好、速度更快、玩转社区</div>
                                            </div>
                                            <div className="item-btn">
                                                <span className="icon icon-ios"></span>
                                                <span className="icon icon-android"></span>
                                                <span id="appDown" onClick={handleClick} className="download-btn">下载</span>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div >
                                <h3 >真人娱乐</h3>
                                <ul className="item">
                                    <li className="grup">
                                        <div className="item-group">
                                            <div className="item-img agqj_app_url">
                                                <div className="img-loading finished">
                                                    <img className="w-100 loaded" src="/images/week/teach.svg" style={{ borderRadius: '1px' }} />
                                                </div>
                                            </div>
                                            <div className="info">
                                                <h3 > PA旗舰 </h3>
                                                <div className="conp">单注最高500万 豪客首选</div>
                                            </div>
                                            <div className="item-btn">
                                                <span className="icon icon-ios"></span>
                                                <span className="icon icon-android"></span>
                                                <span id="appDown" onClick={handleClick} className="download-btn">下载</span>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div >
                                <h3 >通讯软件</h3>
                                <ul className="item">
                                    <li className="grup">
                                        <div className="item-group">
                                            <div className="item-img rich">
                                                <div className="img-loading finished">
                                                    <img className="w-100 loaded" src="/images/week/teach.svg" style={{ borderRadius: '1px' }} />
                                                </div>
                                            </div>
                                            <div className="info">
                                                <h3 > K聊8 </h3>
                                                <div className="conp">随时畅聊</div>
                                            </div>
                                            <div className="item-btn">
                                                <span className="icon icon-ios"></span>
                                                <span className="icon icon-android"></span>
                                                <span id="appDown" onClick={handleClick} className="download-btn">下载</span>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row teach">
                            <div >
                                <ul className="item">
                                    <li className="grup">
                                        <div className="item-group">
                                            <div className="item-img teach">
                                                <div className="img-loading finished">
                                                    <img className="w-100 loaded" src="/images/week/teach.svg" style={{ borderRadius: '1px' }} />
                                                </div>
                                            </div>
                                            <div className="info">
                                                <h3 > 全局访问教程 </h3>
                                                <div className="conp">免下载免安装</div>
                                            </div>
                                            <div className="item-btn">
                                                <span className="icon icon-ios"></span>
                                                <span className="icon icon-android"></span>
                                                <span id="appDown" onClick={handleClick} className="download-btn">下载</span>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div >
                                <ul className="item">
                                    <li className="grup">
                                    <div className="item-group">
                                        <div className="item-img lightApp">
                                            <div className="img-loading finished">
                                                <img className="w-100 loaded" src="/images/week/teach.svg" style={{ borderRadius: '1px' }} />
                                            </div>
                                        </div>
                                        <div className="info">
                                            <h3 > 轻量化APP安装教程 </h3>
                                            <div className="conp">极速下载安装</div>
                                        </div>
                                        <div className="item-btn">
                                            <span className="icon icon-ios"></span>
                                            <span className="icon icon-android" style={{ display: 'none' }}></span>
                                            <span id="appDown" onClick={handleClick} className="download-btn">查看</span>
                                        </div>
                                    </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row teach">
                            <div >
                                <ul className="item">
                                    <li className="grup">
                                        <div className="item-group">
                                            <div className="item-img dcbox">
                                                <div className="img-loading finished">
                                                    <img className="w-100 loaded" src="/images/week/teach.svg" style={{ borderRadius: '1px' }} />
                                                </div>
                                            </div>
                                            <div className="info">
                                                <h3 > 小金库 </h3>
                                                <div className="conp">极速到账 资金安全</div>
                                            </div>
                                            <div className="item-btn">
                                                <span className="icon icon-ios"></span>
                                                <span className="icon icon-android"></span>
                                                <span id="appDown" onClick={handleClick} className="download-btn">下载</span>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div >
                                <ul className="item">
                                    <li className="grup">
                                        <div className="item-group">
                                            <div className="item-img EZPay">
                                                <div className="img-loading finished">
                                                    <img className="w-100 loaded" src="/images/week/teach.svg" style={{ borderRadius: '1px' }} />
                                                </div>
                                            </div>
                                            <div className="info">
                                                <h3 > EZPay </h3>
                                                <div className="conp">极速存取 充提无忧</div>
                                            </div>
                                            <div className="item-btn">
                                                <span className="icon icon-ios"></span>
                                                <span className="icon icon-android"></span>
                                                <span id="appDown" onClick={handleClick} className="download-btn">下载</span>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="appInstallTeach"> 安装教程 &gt; </div>
                        <div className="dialog"></div>
                    </div>

                </div>

            </div>
        </div>
  
    </>

  );
}

