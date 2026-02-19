import { ImageWithFallback } from './figma/ImageWithFallback';

export function RecommendSection() {
  return (
    <div className="px-4 mb-6">
      <h3 className="text-lg font-bold mb-3 text-white">官方推荐</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-lg shadow-sm overflow-hidden border border-zinc-800">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 text-white text-center">
            <div className="text-sm">PG电子</div>
            <div className="text-xs text-purple-100">不朽王朝</div>
            <div className="text-xs mt-1 text-purple-200">奖金</div>
            <div className="text-sm font-bold">¥25,250,065.24</div>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-lg shadow-sm overflow-hidden border border-zinc-800">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-3 text-white text-center relative">
            <div className="text-sm">开元棋牌</div>
            <div className="text-xs text-orange-100">德州扑克</div>
            <div className="text-xs mt-1 text-orange-200">奖金</div>
            <div className="text-sm font-bold">¥18,576,824.74</div>
            <div className="absolute top-0 right-0 bg-red-600 text-xs px-1 rounded-bl">热</div>
          </div>
        </div>
      </div>
    </div>
  );
}