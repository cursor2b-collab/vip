import { openGame } from '@/utils/gameUtils';

export function DecorativeBackground() {
  return (
    <>
      <style>{`
        .promotion-wrapper {
          width: 100%;
          position: relative;
          margin-top: -40px;
          z-index: 1;
        }

        .promotion-wrapper .bg-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .promotion-wrapper .tag {
          width: 1.2rem;
          height: 1.2rem;
          position: absolute;
          top: 60px;
          left: 0.25rem;
          z-index: 2;
        }

        .promotion-wrapper .girls-content {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          flex-direction: row;
          position: relative;
          padding: 0.1rem 0 1.2rem;
          margin-top: -120px;
          z-index: 2;
          overflow: visible;
        }

        .promotion-wrapper .girl-item {
          width: 50%;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: visible;
        }

        .promotion-wrapper .girl-item .board {
          width: 100%;
          height: auto;
          display: block;
          margin-top: -100px;
        }

        @media (min-width: 420px) {
          .promotion-wrapper .girl-item .board {
            margin-top: -120px;
          }
        }

        .promotion-wrapper .girl-item .btn {
          width: 100%;
          height: 50px;
          min-height: 50px;
          margin-top: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-repeat: no-repeat;
          background-size: contain;
          background-position: center;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .promotion-wrapper .girl-item .btn:active {
          opacity: 0.8;
        }

        .promotion-wrapper .girl-item .btn.agqj {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agqj.aa69a658.png_.webp);
        }

        .promotion-wrapper .girl-item .btn.agqj .btn-txt {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agqj_text.81cee160.png_.webp);
          background-repeat: no-repeat;
          background-size: 100%;
          width: 100%;
          height: 100%;
        }

        .promotion-wrapper .girl-item .btn.agin {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agin.44c0fa99.png_.webp);
        }

        .promotion-wrapper .girl-item .btn.agin .btn-txt {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agin_text.9db39219.webp);
          background-size: 100%;
          background-repeat: no-repeat;
          width: 100%;
          height: 100%;
        }

        .promotion-wrapper .girl-item .btn.agqj:active {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agqj_a.4accfdea.png_.webp);
        }

        .promotion-wrapper .girl-item .btn.agqj:active .btn-txt {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agqj_text_a.fc8648cb.png_.webp);
        }

        .promotion-wrapper .girl-item .btn.agin:active {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agin_a.80f065e9.png_.webp);
        }

        .promotion-wrapper .girl-item .btn.agin:active .btn-txt {
          background-image: url(https://www.xpj00000.vip/indexImg/btn_agin_text_a.88346b60.webp);
        }
      `}</style>

      <div className="promotion-wrapper">
        {/* 背景图片 */}
        <img 
          src="https://www.xpj00000.vip/indexImg/bg.9a0603cf.png_.webp"
          alt=""
          className="bg-image"
        />

        {/* 标签 */}
        <img 
          src="https://www.xpj00000.vip/indexImg/tag2.png_.10e399de.webp" 
          className="tag" 
          alt="tag"
        />

        {/* 美女图片内容 */}
        <div className="girls-content">
          <div className="girl-item">
            <img 
              src="https://www.xpj00000.vip/indexImg/agqj.989b0854.png_.webp" 
              className="board" 
              alt="AG旗舰厅"
            />
            <div 
              className="btn agqj"
              onClick={() => openGame('AG', 1, 'AG_BAC')}
            >
              <div className="btn-txt"></div>
            </div>
          </div>

          <div className="girl-item">
            <img 
              src="https://www.xpj00000.vip/indexImg/agin.e1d11ca5.png_.webp" 
              className="board" 
              alt="AG国际厅"
            />
            <div 
              className="btn agin"
              onClick={() => openGame('BG', 1, 'AG_LBAC')}
            >
              <div className="btn-txt"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}