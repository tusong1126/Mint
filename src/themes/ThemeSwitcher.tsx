import { useTheme } from "./ThemeContext";

export default function ThemeSwitcher() {
  const { themeId, setThemeId, themes } = useTheme();

  return (
    <div className="flex gap-2 p-1.5 bg-primary rounded-lg">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setThemeId(t.id)}
          title={t.name}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-md transition-all duration-200
            ${themeId === t.id ? "bg-card shadow-sm ring-1 ring-accent/30" : "hover:bg-card/50"}`}
        >
          <span className="text-xs font-medium text-text-primary">
            {t.icon} {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
