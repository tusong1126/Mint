const tools = [
  { icon: '📋', name: '待办事项', desc: '管理日常任务', key: 'todolist' },
  { icon: '📝', name: 'Markdown', desc: '编写与预览文档', key: 'markdown' },
]

interface Props {
  onNavigate?: (key: string) => void
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="max-w-[600px] mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-[22px] font-bold mb-1.5">欢迎使用 Mint</h2>
        <p className="text-[13px] text-text-muted">个人效率工具集，所有数据本地存储，安全可控</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-8">
        {tools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => onNavigate?.(tool.key)}
            className="flex items-center gap-3.5 p-[18px] bg-card border border-transparent rounded-lg cursor-pointer transition-all duration-150 hover:border-accent hover:-translate-y-px text-left font-inherit text-inherit"
          >
            <span className="text-[28px] w-11 h-11 flex items-center justify-center bg-primary rounded-[10px] shrink-0">
              {tool.icon}
            </span>
            <div>
              <span className="block text-sm font-semibold text-text-primary">{tool.name}</span>
              <span className="block text-xs text-text-muted mt-0.5">{tool.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-8 p-5 bg-card rounded-lg">
        {[
          { num: '2', label: '可用工具' },
          { num: '100%', label: '本地存储' },
          { num: '0', label: '网络请求' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <span className="block text-2xl font-bold text-accent">{s.num}</span>
            <span className="block text-[11px] text-text-muted mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}