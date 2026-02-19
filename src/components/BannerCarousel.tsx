import { useState, useEffect } from 'react';
import { getBanners, type Banner } from '@/lib/api/system';

const DEFAULT_BANNERS = [
  'https://www.xpj00000.vip/indexImg/a3c5a243c548ec8490c7a926a74c27bc.jpg_.webp',
  'https://www.xpj00000.vip/indexImg/5b69e8f06b714db2aea98ca13f2dea05.jpg_.webp',
  'https://www.xpj00000.vip/indexImg/31814cf135293179d2232093aaaabe5d.jpg_.webp',
  'https://www.xpj00000.vip/indexImg/fc52919dbf2f2c9b140ebd945f825ddf.jpg_.webp',
];

export function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await getBanners(2); // 2 = 移动端
        if (res.code === 200 && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setBanners(res.data);
        } else {
          setBanners(DEFAULT_BANNERS.map((src) => ({ src, url: src, link: undefined })));
        }
      } catch {
        setBanners(DEFAULT_BANNERS.slice(0, 2).map((src) => ({ src, url: src, link: undefined })));
      }
    };
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const hasBanners = banners.length > 0;

  return (
    <div className="px-4 py-3">
      <div className="relative overflow-hidden rounded-[12px]" style={{ minHeight: 180 }}>
        <div className="relative w-full" style={{ height: 180 }}>
          {hasBanners ? (
            banners.map((banner, index) => {
              const src = banner?.src || (typeof banner === 'string' ? banner : '');
              const link = (banner as Banner)?.link || (banner as Banner)?.url;
              return (
                <div
                  key={(banner as Banner)?.id ?? index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img
                        src={src}
                        alt={(banner as Banner)?.title || `Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: 0 }}
                      />
                    </a>
                  ) : (
                    <img
                      src={src}
                      alt={(banner as Banner)?.title || `Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                      style={{ borderRadius: 0 }}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="absolute inset-0 bg-[#1a1f35]" />
          )}
        </div>

        {hasBanners && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex justify-center gap-1.5 z-10"
          style={{ bottom: 10 }}
        >
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all cursor-pointer h-1.5 flex-shrink-0 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/40 hover:bg-white/60 w-1.5'
              }`}
              aria-label={`切换到第 ${index + 1} 张`}
            />
          ))}
        </div>
        )}
      </div>
    </div>
  );
}