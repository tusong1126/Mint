import { homePageTools } from "../../config/tools";

interface Props {
  onNavigate?: (key: string) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "☀️ 早上好";
  if (h < 18) return "🌤 下午好";
  return "🌙 晚上好";
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="max-w-[720px] mx-auto space-y-6 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden bg-card rounded-2xl border border-border/40 p-7">
        <div className="relative z-10">
          <h2 className="text-[26px] font-bold text-text-primary mt-4">{getGreeting()}，欢迎使用 Mint</h2>
          <p className="text-[13px] text-text-muted leading-relaxed mt-1.5 max-w-md">
            个人效率工具集，所有数据本地存储，安全可控
          </p>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
      </div>

      {/* Tools */}
      <div>
        <div className="flex items-baseline gap-2 mb-3 px-1">
          <h3 className="text-sm font-semibold text-text-primary">快捷工具</h3>
          <span className="text-[11px] text-text-muted">快速访问常用功能</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {homePageTools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => onNavigate?.(tool.key)}
              className="group relative bg-card rounded-xl border border-border/50 p-5 text-left cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-accent/30 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <span className="text-[24px] w-11 h-11 flex items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 ring-1 ring-accent/10 group-hover:ring-accent/30 transition-all duration-200">
                  {tool.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-200">
                    {tool.name}
                  </span>
                  <span className="block text-xs text-text-muted mt-0.5">{tool.desc}</span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-muted/30 group-hover:text-accent/50 transition-all duration-200 group-hover:translate-x-0.5 shrink-0"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats - pseudo-3D */}
      <div
        className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-300"
        style={{
          boxShadow: "0 1px 3px var(--shadow), 0 8px 24px var(--shadow)",
        }}
      >
        <div className="grid grid-cols-3" style={{ transformStyle: "preserve-3d" }}>
          {[
            { num: "4", label: "可用工具", desc: "持续扩展中" },
            { num: "100%", label: "本地存储", desc: "数据自主可控" },
            { num: "0", label: "网络请求", desc: "完全离线运行" },
          ].map((s) => (
            <div
              key={s.label}
              className="group relative py-6 text-center border-r border-border/50 last:border-r-0 cursor-default transition-all duration-300"
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateZ(16px) rotateX(-4deg)";
                el.style.zIndex = "10";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateZ(0) rotateX(0deg)";
                el.style.zIndex = "0";
              }}
            >
              {/* Hover background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[inherit]" />
              {/* Top accent bar */}
              <div className="absolute top-0 left-6 right-6 h-[3px] bg-gradient-to-r from-accent/50 to-accent/10 rounded-full" />
              {/* Content */}
              <div className="relative z-10">
                <span className="block text-[30px] font-extrabold text-accent leading-none mb-1.5 tracking-tight">
                  {s.num}
                </span>
                <span className="block text-[13px] font-semibold text-text-primary">{s.label}</span>
                <span className="block text-[11px] text-text-muted mt-1">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-card/50 rounded-xl border border-border/30 p-5">
        <div className="flex items-start gap-3">
          <span className="text-lg leading-none shrink-0 mt-0.5">💡</span>
          <div>
            <span className="block text-sm font-semibold text-text-primary">使用提示</span>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              所有工具数据均存储在本地，不会上传到任何服务器。你可以通过左侧边栏快速切换工具。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
