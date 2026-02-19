import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <img 
        src="/images/newimg/gameloading.gif" 
        alt="loading" 
        className="loading-gif"
        style={{
          width: '80px',
          height: '80px',
          objectFit: 'contain'
        }}
      />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  .loading-bar {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
  }

  /* 中心图片 */
  .loading-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;          /* 控制图片大小 */
    height: 40px;
    transform: translate(-50%, -50%);
    object-fit: contain;
    z-index: 2;
    animation: iconPulse 2.5s ease-in-out infinite;
  }

  @keyframes iconPulse {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  @keyframes iconRotate {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  @keyframes iconShine {
    0% {
      left: -60%;
    }
    100% {
      left: 120%;
    }
  }

  /* 旋转外圈（图片） */
  .loading-bar::before {
    content: "";
    position: absolute;
    top: -6px;
    left: -6px;
    width: 92px;
    height: 92px;
    background: url("https://ik.imagekit.io/gpbvknoim/rotate.9636734b.png") no-repeat center;
    background-size: contain;
    animation: rotateRing 2s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes rotateRing {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .icon-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    overflow: hidden; /* 关键：裁剪光泽 */
    z-index: 2;
  }

  .icon-wrapper::after {
    content: "";
    position: absolute;
    top: 0;
    left: -60%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      rgba(255, 255, 255, 0.35),
      rgba(255, 255, 255, 0.15),
      transparent
    );
    transform: skewX(-20deg);
    animation: iconShine 2.8s infinite linear;
    pointer-events: none;
  }
`;

export default Loader;

