import React from 'react';
import styled from 'styled-components';

interface AnimatedButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<AnimatedButtonProps> = ({ onClick, disabled, children, type = 'button' }) => {
  return (
    <StyledWrapper>
      <div className="button-wrap">
        <button className="button" onClick={onClick} disabled={disabled} type={type}>
          <div className="glow" />
          <div className="bg">
            <div className="shine" />
          </div>
          <div className="wave" />
          <div className="wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 974 367" height={367} width={974} className="circuit">
              <g className="circuit-path circuit-path-2">
                <g className="circuit-side">
                  <path strokeWidth={2} stroke="url(#paint0_linear_73_31)" d="M0 1H185.5" style={{'--i': 1} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint1_linear_73_31)" d="M0 33H185.5" style={{'--i': 2} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint2_linear_73_31)" d="M10 84.5L50.6881 62.7689C52.8625 61.6075 55.2896 61 57.7547 61H185.5" style={{'--i': 3} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint3_linear_73_31)" d="M973.5 1H788" style={{'--i': 4} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint4_linear_73_31)" d="M973.5 33H788" style={{'--i': 5} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint5_linear_73_31)" d="M963.5 84.5L922.812 62.7689C920.638 61.6075 918.21 61 915.745 61H788" style={{'--i': 6} as React.CSSProperties} />
                </g>
                <g className="circuit-bottom">
                  <path strokeWidth={2} stroke="url(#paint6_linear_73_31)" d="M412.5 112V186.744C412.5 192.676 409.004 198.051 403.582 200.456L359.418 220.044C353.996 222.449 350.5 227.824 350.5 233.756V354" style={{'--i': 7} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint7_linear_73_31)" d="M533.5 112V209.625C533.5 213.402 534.925 217.04 537.491 219.812L560.509 244.688C563.075 247.46 564.5 251.098 564.5 254.875V355" style={{'--i': 8} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint8_linear_73_31)" d="M503.5 112V191.79C503.5 194.856 502.56 197.849 500.808 200.364L475.192 237.136C473.44 239.651 472.5 242.644 472.5 245.71V367" style={{'--i': 9} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint9_linear_73_31)" d="M443.5 112V355" style={{'--i': 10} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint10_linear_73_31)" d="M472.5 112V355" style={{'--i': 11} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint11_linear_73_31)" d="M562.5 112V166.617C562.5 174.855 569.145 181.552 577.383 181.616L611.617 181.884C619.855 181.948 626.5 188.645 626.5 196.883V305" style={{'--i': 12} as React.CSSProperties} />
                </g>
              </g>
              <g className="circuit-path circuit-path-1">
                <g className="circuit-side">
                  <path strokeWidth={2} stroke="url(#paint0_linear_73_31)" d="M0 1H185.5" style={{'--i': 1} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint1_linear_73_31)" d="M0 33H185.5" style={{'--i': 2} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint2_linear_73_31)" d="M10 84.5L50.6881 62.7689C52.8625 61.6075 55.2896 61 57.7547 61H185.5" style={{'--i': 3} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint3_linear_73_31)" d="M973.5 1H788" style={{'--i': 4} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint4_linear_73_31)" d="M973.5 33H788" style={{'--i': 5} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint5_linear_73_31)" d="M963.5 84.5L922.812 62.7689C920.638 61.6075 918.21 61 915.745 61H788" style={{'--i': 6} as React.CSSProperties} />
                </g>
                <g className="circuit-bottom">
                  <path strokeWidth={2} stroke="url(#paint6_linear_73_31)" d="M412.5 112V186.744C412.5 192.676 409.004 198.051 403.582 200.456L359.418 220.044C353.996 222.449 350.5 227.824 350.5 233.756V354" style={{'--i': 7} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint7_linear_73_31)" d="M533.5 112V209.625C533.5 213.402 534.925 217.04 537.491 219.812L560.509 244.688C563.075 247.46 564.5 251.098 564.5 254.875V355" style={{'--i': 8} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint8_linear_73_31)" d="M503.5 112V191.79C503.5 194.856 502.56 197.849 500.808 200.364L475.192 237.136C473.44 239.651 472.5 242.644 472.5 245.71V367" style={{'--i': 9} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint9_linear_73_31)" d="M443.5 112V355" style={{'--i': 10} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint10_linear_73_31)" d="M472.5 112V355" style={{'--i': 11} as React.CSSProperties} />
                  <path strokeWidth={2} stroke="url(#paint11_linear_73_31)" d="M562.5 112V166.617C562.5 174.855 569.145 181.552 577.383 181.616L611.617 181.884C619.855 181.948 626.5 188.645 626.5 196.883V305" style={{'--i': 12} as React.CSSProperties} />
                </g>
              </g>
              <g className="circuit-bg">
                <g className="circuit-side">
                  <path strokeWidth={2} stroke="url(#paint0_linear_73_31)" d="M0 1H185.5" />
                  <path strokeWidth={2} stroke="url(#paint1_linear_73_31)" d="M0 33H185.5" />
                  <path strokeWidth={2} stroke="url(#paint2_linear_73_31)" d="M10 84.5L50.6881 62.7689C52.8625 61.6075 55.2896 61 57.7547 61H185.5" />
                  <path strokeWidth={2} stroke="url(#paint3_linear_73_31)" d="M973.5 1H788" />
                  <path strokeWidth={2} stroke="url(#paint4_linear_73_31)" d="M973.5 33H788" />
                  <path strokeWidth={2} stroke="url(#paint5_linear_73_31)" d="M963.5 84.5L922.812 62.7689C920.638 61.6075 918.21 61 915.745 61H788" />
                </g>
                <g className="circuit-bottom">
                  <path strokeWidth={2} stroke="url(#paint6_linear_73_31)" d="M412.5 112V186.744C412.5 192.676 409.004 198.051 403.582 200.456L359.418 220.044C353.996 222.449 350.5 227.824 350.5 233.756V354" />
                  <path strokeWidth={2} stroke="url(#paint7_linear_73_31)" d="M533.5 112V209.625C533.5 213.402 534.925 217.04 537.491 219.812L560.509 244.688C563.075 247.46 564.5 251.098 564.5 254.875V355" />
                  <path strokeWidth={2} stroke="url(#paint8_linear_73_31)" d="M503.5 112V191.79C503.5 194.856 502.56 197.849 500.808 200.364L475.192 237.136C473.44 239.651 472.5 242.644 472.5 245.71V367" />
                  <path strokeWidth={2} stroke="url(#paint9_linear_73_31)" d="M443.5 112V355" />
                  <path strokeWidth={2} stroke="url(#paint10_linear_73_31)" d="M472.5 112V355" />
                  <path strokeWidth={2} stroke="url(#paint11_linear_73_31)" d="M562.5 112V166.617C562.5 174.855 569.145 181.552 577.383 181.616L611.617 181.884C619.855 181.948 626.5 188.645 626.5 196.883V305" />
                </g>
              </g>
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" y2="1.5" x2={265} y1="1.5" x1={0} id="paint0_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.155" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="33.5" x2={265} y1="33.5" x1={0} id="paint1_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="72.75" x2={265} y1="72.75" x1={10} id="paint2_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="1.5" x2="708.5" y1="1.5" x1="973.5" id="paint3_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.155" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="33.5" x2="708.5" y1="33.5" x1="973.5" id="paint4_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="72.75" x2="708.5" y1="72.75" x1="963.5" id="paint5_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2={97} x2={390} y1={354} x1={390} id="paint6_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.105" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2={97} x2={556} y1={355} x1={556} id="paint7_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.105" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2={97} x2={526} y1={355} x1={526} id="paint8_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.105" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2={97} x2={466} y1={355} x1={466} id="paint9_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.105" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2={97} x2={495} y1={355} x1={495} id="paint10_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.105" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2={97} x2={585} y1={305} x1={585} id="paint11_linear_73_31">
                  <stop stopOpacity={0} stopColor="#FEC33B" offset="0.105" />
                  <stop stopColor="#FEC33B" offset={1} />
                </linearGradient>
              </defs>
            </svg>
            <div className="wrap-content">
              <div className="content">
                <div className="outline" />
                <div className="glyphs">
                  {typeof children === 'string' ? (
                    <span className="text-simple">{children}</span>
                  ) : children || (
                    <span className="text-simple">StartShipping</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button {
    --radius: 18px;
    outline: none;
    cursor: pointer;
    font-size: 18px;
    background: transparent;
    border: 0;
    position: relative;
    width: 180px;
    height: 50px;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
    border-radius: var(--radius);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .button::before,
  .button::after {
    content: "";
    position: absolute;
    top: 40%;
    z-index: 0;
    height: 50px;
    width: 50%;
    background: black;
    filter: blur(10px);
    border-radius: 10px;
    opacity: 0.7;
    pointer-events: none;
    touch-action: none;
  }

  .button::before {
    left: -2px;
    transform: rotate(-15deg);
  }

  .button::after {
    right: -2px;
    transform: rotate(15deg);
  }

  .glow {
    position: absolute;
    inset: 0;
    box-shadow: 0 0 200px 5px rgba(255, 208, 0, 0.4);
    pointer-events: none;
    touch-action: none;
  }

  .glow::before {
    content: "";
    position: absolute;
    margin: auto;
    background: rgba(160, 158, 122, 0.05);
    border-radius: 50%;
    filter: blur(50px);
    inset: 0;
    height: 500px;
    width: 150px;
    transform: rotate(-45deg);
  }

  .wave {
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
    margin: auto;
    transition: all 0.3s linear;
  }

  .wave::before,
  .wave::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border: 0.5px solid rgba(255, 208, 0, 0.4);
    inset: 0;
    filter: blur(2px);
    border-radius: 30px;
  }

  .button:focus .wave::before,
  .button:focus .wave::after {
    animation: wave 2.2s linear;
  }

  .button:focus .wave::after {
    animation-delay: 0.35s;
  }

  @keyframes wave {
    0%,
    40% {
      transform: scale(1);
      opacity: 0;
      box-shadow:
        0 0 30px 10px black,
        inset 0 0 30px rgba(255, 255, 255, 0.1);
    }
    60% {
      transform: scale(1.2, 1.5);
      opacity: 1;
    }
    100% {
      transform: scale(1.6, 2);
      opacity: 0;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
    }
  }

  .bg {
    position: absolute;
    inset: -7px;
    border-radius: calc(var(--radius) * 1.35);
    z-index: 1;
    overflow: hidden;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
  }

  .bg::before,
  .bg::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: calc(var(--radius) * 1.35);
  }

  .bg::after {
    background: black;
    box-shadow:
      inset 0 0 0 1px rgba(92, 83, 54, 0.4),
      inset -2px 0 0 -1px rgba(92, 83, 54, 1),
      inset 0 -2px 0 -1px rgba(92, 83, 54, 0.1);
  }

  .bg .shine {
    transition: all 0.5s linear;
    color: rgba(255, 239, 168, 0.85);
  }

  .button:active .bg .shine {
    color: rgba(42, 255, 205, 0.85);
  }

  .bg .shine::before {
    content: "";
    position: absolute;
    z-index: 2;
    background: currentColor;
    width: 10px;
    height: 10px;
    opacity: 0.3;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    border-radius: 50%;
    filter: blur(2px);
    transform: translateY(0) scale(0);
    animation: shine 2.2s linear infinite;
  }

  @keyframes shine {
    0% {
      transform: translateY(0) scale(0);
    }
    20% {
      transform: translateY(0) scale(25);
    }
    100% {
      transform: translateY(-280px) scale(20, 18);
    }
  }

  .outline {
    position: absolute;
    overflow: hidden;
    inset: 0;
    outline: none;
    border-radius: inherit;
    transition: all 0.4s ease;
  }

  .outline::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 120px;
    height: 300px;
    margin: auto;
    background: linear-gradient(
      to right,
      transparent 0%,
      #ffea00 50%,
      transparent 100%
    );
    animation: spin 1.7s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .circuit {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%);
    width: 300px;
    height: auto;
    margin-top: -13px;
    pointer-events: none;
    touch-action: none;
  }

  .circuit-bg {
    opacity: 0.5;
  }

  .circuit-path {
    opacity: 0;
    transition: opacity 0.4s linear;
  }

  .circuit-path .circuit-side path {
    stroke-dasharray: 200;
    stroke-dashoffset: 200;
    animation: line-1 1.7s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.2s);
  }

  @keyframes line-1 {
    0% {
      stroke-dashoffset: 200;
      filter: blur(2px) brightness(2);
    }
    70% {
      stroke-dashoffset: 0;
    }
    100% {
      opacity: 0;
    }
  }

  .circuit-path .circuit-bottom path {
    stroke-dasharray: 250;
    stroke-dashoffset: -250;
    animation: line-2 2.2s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.1s);
  }

  @keyframes line-2 {
    0% {
      stroke-dashoffset: -250;
      filter: blur(2px) brightness(2);
    }
    70% {
      stroke-dashoffset: 0;
    }
    100% {
      opacity: 0;
    }
  }

  .circuit-path-2 .circuit-side path {
    animation-duration: 0.7s;
  }

  .circuit-path-2 .circuit-bottom path {
    animation-duration: 0.9s;
  }

  .circuit-path-2 .circuit-side path,
  .circuit-path-2 .circuit-bottom path {
    filter: sepia(50%) saturate(500%) hue-rotate(90deg) brightness(100%)
      contrast(100%) drop-shadow(0 0 0 white);
  }

  .button .circuit-path-1 {
    opacity: 1;
  }

  .button:hover .circuit-path-2 {
    opacity: 0;
  }

  .button:hover .circuit-path-1 {
    opacity: 1;
  }

  .button:focus .wrap:hover .circuit-path-1 {
    opacity: 1;
  }

  .button:focus .wrap:hover .circuit-path-2,
  .button:active .wrap:hover .circuit-path-1 {
    opacity: 0;
  }

  .button:active .wrap:hover .circuit-path-2 {
    opacity: 0;
  }

  .wrap-content {
    position: absolute;
    inset: 0;
    z-index: 1;
    transition: all 0.3s ease;
  }

  .button:active .wrap-content {
    transform: scale(0.97, 0.96);
  }

  .content {
    border-radius: var(--radius);
    overflow: hidden;
    height: 100%;
    padding: 2px;
    background: #fedc83;
    box-shadow:
      inset 0 0 16px 6px #c88a00,
      inset 0 -10px 10px -8px #ffac82;
    position: relative;
  }

  .button:hover .content {
    animation: none;
  }

  @keyframes shake {
    15% {
      transform: translate(1px, 1px);
    }
    30% {
      transform: translate(0, -1px);
    }
    45% {
      transform: translate(1px, -1px);
    }
    55% {
      transform: translate(-1px, 1px);
    }
    70% {
      transform: translate(1px, 0);
    }
    85% {
      transform: translate(-1px, -1px);
    }
  }

  .button:focus .content {
    animation: shake-out 1.9s ease forwards;
  }

  @keyframes shake-out {
    5% {
      transform: translate(2px, 2px);
    }
    10% {
      transform: translate(0, -2px);
    }
    15% {
      transform: translate(2px, -2px);
    }
    20% {
      transform: translate(-2px, 2px);
    }
    25% {
      transform: translate(2px, 0);
    }
    30% {
      transform: translate(-2px, -2px);
    }
    35% {
      transform: translate(2px, 2px);
    }
    40% {
      transform: translate(0, -2px);
    }
    45% {
      transform: translate(2px, -2px);
    }
    48% {
      transform: scale(0.9);
    }
    100% {
      transform: translate(0);
    }
  }

  .glyphs {
    pointer-events: none;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    position: relative;
    height: 100%;
    gap: 10px;
    border-radius: calc(var(--radius) * 0.85);
    font-weight: 600;
    background: #fedc83;
    box-shadow:
      inset 0 0 16px 6px #c88a00,
      0 0 10px 10px rgba(0, 0, 0, 0.2),
      inset 0 -10px 10px -8px rgb(255, 89, 0);
    transition: all 0.3s ease;
  }

  .text-simple {
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
    text-shadow: 0 2px 3px #dabc45;
    font-weight: 600;
    white-space: nowrap;
  }
`;

export default Button;

