const tools = [
  { icon: '📋', name: '待办事项', desc: '管理日常任务', key: 'todolist' },
  { icon: '📝', name: 'Markdown', desc: '编写与预览文档', key: 'markdown' },
]

interface Props {
  onNavigate?: (key: string) => void
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="max-w-[640px] mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-[24px] font-bold mb-2 text-text-primary">欢迎使用 Mint</h2>
        <p className="text-[13px] text-text-muted leading-relaxed">个人效率工具集，所有数据本地存储，安全可控</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-10">
        {tools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => onNavigate?.(tool.key)}
            className="flex items-center gap-4 p-5 bg-card rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-left border border-border/50 hover:border-accent/30 group"
          >
            <span className="text-[28px] w-12 h-12 flex items-center justify-center bg-primary rounded-xl shrink-0 group-hover:bg-accent/10 transition-colors">
              {tool.icon}
            </span>
            <div>
              <span className="block text-sm font-semibold text-text-primary">{tool.name}</span>
              <span className="block text-xs text-text-muted mt-0.5">{tool.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-10 p-6 bg-card rounded-xl border border-border/50">
        {[
          { num: '2', label: '可用工具', desc: '持续扩展中' },
          { num: '100%', label: '本地存储', desc: '数据自主可控' },
          { num: '0', label: '网络请求', desc: '完全离线运行' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <span className="block text-[28px] font-bold text-accent leading-none mb-1">{s.num}</span>
            <span className="block text-[13px] font-semibold text-text-primary">{s.label}</span>
            <span className="block text-[11px] text-text-muted mt-0.5">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}