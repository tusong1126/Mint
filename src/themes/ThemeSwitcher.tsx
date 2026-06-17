import { useTheme } from './ThemeContext'

export default function ThemeSwitcher() {
  const { themeId, setThemeId, themes } = useTheme()

  return (
    <div className="flex gap-1 p-1 bg-card rounded-lg">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setThemeId(t.id)}
          title={t.name}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-md transition-colors duration-150
            ${themeId === t.id ? 'bg-primary' : 'hover:bg-hover'}`}
        >
          <span
            className="w-3 h-3 rounded-full shrink-0 border border-border"
            style={{ background: t.vars['--accent'] }}
          />
          <span className="text-[13px] leading-none">{t.icon}</span>
        </button>
      ))}
    </div>
  )
}