import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 主图加载失败时尝试的备用图（如本地默认图），备用图再失败才显示占位 */
  fallbackSrc?: string
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { fallbackSrc, src, alt, style, className, ...rest } = props
  const [didError, setDidError] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)

  const handleError = () => {
    if (fallbackSrc && !usedFallback) {
      setUsedFallback(true)
      return
    }
    setDidError(true)
  }

  const handleFallbackError = () => {
    setFallbackFailed(true)
    setDidError(true)
  }

  const showErrorPlaceholder = didError && (fallbackFailed || !fallbackSrc)
  const currentSrc = usedFallback ? fallbackSrc : src

  if (showErrorPlaceholder) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
        </div>
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={usedFallback ? handleFallbackError : handleError}
    />
  )
}
