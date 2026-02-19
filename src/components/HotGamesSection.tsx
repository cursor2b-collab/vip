import { ImageWithFallback } from './figma/ImageWithFallback';

export function HotGamesSection() {
  const games = [
    { name: '真人视讯', players: '1.4万人', image: 'https://www.xpj00000.vip/indexImg/photo-1574598217093-70d3d0e8bf6d.jpg' },
    { name: '星期体育', players: '1.30%', image: 'https://www.xpj00000.vip/indexImg/photo-1599579887642-9821ebe3c79a.jpg' }
  ];

  return (
    <div className="px-4 mb-6">
      <h3 className="text-lg font-bold mb-3 text-white">热门游戏</h3>
      <div className="grid grid-cols-2 gap-4">
        {games.map((game, index) => (
          <div key={index} className="bg-zinc-900 rounded-lg shadow-sm overflow-hidden border border-zinc-800">
            <div className="relative">
              <ImageWithFallback 
                src={game.image}
                alt={game.name}
                className="w-full h-20 object-cover opacity-70"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                <div className="text-sm font-medium">{game.name}</div>
                <div className="text-xs text-zinc-300">高达 {game.players}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}