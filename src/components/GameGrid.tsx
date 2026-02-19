import { ImageWithFallback } from './figma/ImageWithFallback';

export function GameGrid() {
  const games = [
    { name: 'CQ9维修', rate: '1.50%', color: 'from-blue-500 to-blue-600' },
    { name: '开元棋牌', rate: '1.30%', color: 'from-green-500 to-green-600' },
    { name: '神话娱乐2', rate: '', color: 'from-purple-500 to-purple-600' },
    { name: '富豪会王', rate: '', color: 'from-red-500 to-red-600' },
    { name: '雷神之锤', rate: '', color: 'from-yellow-500 to-orange-500' },
    { name: '森林舞会', rate: '', color: 'from-green-600 to-teal-600' },
    { name: '宝石之王', rate: '', color: 'from-pink-500 to-rose-600' },
    { name: '王者天下', rate: '', color: 'from-indigo-500 to-purple-600' }
  ];

  return (
    <div className="px-4 mb-6">
      <h3 className="text-lg font-bold mb-3 text-white">热门电子</h3>
      <div className="grid grid-cols-4 gap-3">
        {games.map((game, index) => (
          <div key={index} className="text-center">
            <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${game.color} mb-2 flex items-center justify-center relative overflow-hidden`}>
              <ImageWithFallback 
                src="https://www.xpj00000.vip/indexImg/photo-1687679182946-0a9540094bbe.jpg"
                alt={game.name}
                className="w-8 h-8 text-white"
              />
              {game.rate && (
                <div className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded">
                  {game.rate}
                </div>
              )}
            </div>
            <div className="text-xs text-zinc-400">{game.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}