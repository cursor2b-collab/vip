import {
  ChevronRight,
  Wallet,
  Users,
  Bell,
  Settings,
} from "lucide-react";
import profileAvatar from "figma:asset/5d5e5546533189a7a5de26f80e5e39c5ab751478.png";

interface ProfilePageProps {
  onNavigateToDeposit?: () => void;
}

export function ProfilePage({
  onNavigateToDeposit,
}: ProfilePageProps) {
  sessionStorage.setItem('hasVisited', 'false');
  console.log('111111');
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white pb-20">
      {/* 用户信息区域 */}
      <div className="bg-gradient-to-b from-[#1a1f2e] to-[#0a0e1a] px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* 用户头像 - 金色圆环 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 p-1">
                <div className="w-full h-full rounded-full bg-[#1a1f2e] flex items-center justify-center overflow-hidden">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💎</span>
                  </div>
                </div>
              </div>
              {/* 装饰性光效 */}
              <div className="absolute -top-1 -right-1 w-6 h-6">
                <div className="w-full h-full bg-yellow-400 rounded-full blur-sm opacity-60"></div>
                <div className="absolute top-1 left-1 w-4 h-4 bg-yellow-300 rounded-full"></div>
              </div>
            </div>

            {/* 用户名和标签 */}
            <div>
              <div className="text-lg mb-1">cc89124692</div>
              <div className="inline-block bg-gradient-to-r from-amber-700 to-amber-600 px-3 py-0.5 rounded-full text-xs">
                🎭 新人
              </div>
            </div>
          </div>
        </div>

        {/* VIP进度提示 */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-zinc-400">
              成功充值即回升级1层
            </span>
          </div>
          <div className="flex items-center gap-1 text-zinc-300">
            升星达标1
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* VIP会员横幅 */}
        <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40 rounded-xl p-4 border border-amber-700/50 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="text-xl tracking-wider">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                  VIP会员尊享专属特权
                </span>
              </div>
              <button className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-3 py-1 rounded-full text-xs border border-yellow-500">
                查看
              </button>
            </div>
            <div className="text-4xl">🦅</div>
          </div>
          {/* 装饰光效 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(https://www.xpj00000.vip/indexImg/%E4%B8%8B%E8%BD%BD%20(3).png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
            }}
          ></div>
        </div>
      </div>

      {/* 主要功能区 */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <button
            onClick={onNavigateToDeposit}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-xl flex items-center justify-center border border-yellow-700/30">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">⬆️</span>
              </div>
            </div>
            <span className="text-sm text-zinc-300">存款</span>
          </button>

          <button className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-xl flex items-center justify-center border border-yellow-700/30">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">⬇️</span>
              </div>
            </div>
            <span className="text-sm text-zinc-300">取款</span>
          </button>

          <button className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-xl flex items-center justify-center border border-yellow-700/30">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
            </div>
            <span className="text-sm text-zinc-300">洗码</span>
          </button>

          <button className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-xl flex items-center justify-center border border-yellow-700/30">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
            <span className="text-sm text-zinc-300">记录</span>
          </button>
        </div>

        {/* 促销横幅 */}
        <div className="mb-4 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900 via-red-900 to-purple-900 p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl mb-1">
                  <span className="bg-gradient-to-r from-yellow-300 via-red-400 to-pink-400 bg-clip-text text-transparent">
                    劲爆20周年 PA携手团庆
                  </span>
                </div>
                <div className="text-xs text-zinc-300 tracking-wide">
                  🎊 解锁新版 🔥炫享首发 💎尊领惠享 🎁
                </div>
              </div>
              <div className="text-5xl">🎮</div>
            </div>
            {/* 装饰点 */}
            <div className="absolute bottom-2 right-20 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === 0 ? "bg-yellow-400" : "bg-zinc-600"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* 次要功能区 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-zinc-800/50 rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-zinc-400" />
            </div>
            <span className="text-xs text-zinc-400">
              我的钱包
            </span>
          </button>

          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-zinc-800/50 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-zinc-400" />
            </div>
            <span className="text-xs text-zinc-400">
              推荐好友
            </span>
          </button>

          <button className="flex flex-col items-center gap-2 relative">
            <div className="w-14 h-14 bg-zinc-800/50 rounded-xl flex items-center justify-center">
              <Bell className="w-7 h-7 text-zinc-400" />
              {/* 消息徽章 */}
              <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
                4
              </div>
            </div>
            <span className="text-xs text-zinc-400">
              我的消息
            </span>
          </button>

          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-zinc-800/50 rounded-xl flex items-center justify-center">
              <Settings className="w-7 h-7 text-zinc-400" />
            </div>
            <span className="text-xs text-zinc-400">
              账户设置
            </span>
          </button>
        </div>

        {/* 退出登录按钮 */}
        <button className="w-full bg-zinc-800/30 text-zinc-400 rounded-lg py-3 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
          退出登录
        </button>
      </div>
    </div>
  );
}