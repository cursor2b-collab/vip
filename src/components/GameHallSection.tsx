import { ImageWithFallback } from './figma/ImageWithFallback';

export function GameHallSection() {
  const games = [
    { name: '剑仙传说', icon: '⚔️' },
    { name: '神秘号7', icon: '🎰' },
    { name: '幸运花', icon: '🌸' },
    { name: '凤凰玄女', icon: '🐦' },
    { name: '黄金之王', icon: '👑' }
  ];

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">你正在游戏大厅</h3>
        <button className="text-blue-400 text-sm">全部游戏</button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto">
        {games.map((game, index) => (
          <div key={index} className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-2">
              <span className="text-2xl">{game.icon}</span>
            </div>
            <div className="text-xs text-center text-zinc-400">{game.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}