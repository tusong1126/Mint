import { useState, useEffect, useCallback } from "react";
import Tooltip from "./components/Tooltip";
import Settings from "./tools/Settings";
import { allTools } from "./config/tools";
import type { Tool } from "./config/tools";

const STORAGE_KEY = "app-favorites";

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return ["home", "todolist"];
}

function saveFavorites(keys: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED = 72;

function SidebarCollapseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.5" y="2.5" width="15" height="13" rx="2" />
      <line x1="11.5" y1="6" x2="11.5" y2="12" />
      <path d="M8.5 7.5L6.5 9l2 1.5" />
    </svg>
  );
}

function SidebarExpandIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.5" y="2.5" width="15" height="13" rx="2" />
      <line x1="6.5" y1="6" x2="6.5" y2="12" />
      <path d="M9.5 7.5l2 1.5-2 1.5" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <line x1="2" y1="6" x2="10" y2="6" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="8" height="8" rx="1" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="4" y="1" width="7" height="7" rx="1" />
      <rect x="1" y="4" width="7" height="7" rx="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="2" y1="2" x2="10" y2="10" />
      <line x1="10" y1="2" x2="2" y2="10" />
    </svg>
  );
}

function PinIcon({ pinned }: { pinned: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill={pinned ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 4.5L12 2M9.5 4.5l2 3.5-3 1-2.5 2.5L5 9.5 2.5 12 2 11.5 4.5 9 2.5 6.5 5 4l1-3 3.5 2z" />
    </svg>
  );
}

export default function App() {
  const [activeTool, setActiveTool] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [toolboxOpen, setToolboxOpen] = useState(true);

  const isMac = window.electronAPI?.platform === "darwin";

  useEffect(() => {
    if (!isMac && window.electronAPI?.window) {
      window.electronAPI.window.isMaximized().then(setMaximized);
      window.electronAPI.window.onMaximized(setMaximized);
    }
  }, [isMac]);

  const toggleFavorite = useCallback((key: string) => {
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      saveFavorites(next);
      return next;
    });
  }, []);

  const active = allTools.find((t) => t.key === activeTool);
  const isSettings = activeTool === "settings";
  const ActiveComponent = isSettings ? Settings : active?.component;

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W;
  const favoriteTools = allTools.filter((t) => favorites.includes(t.key));

  function NavTool({ tool, showPin }: { tool: Tool; showPin?: boolean }) {
    const isActive = activeTool === tool.key;
    return (
      <div className="group relative">
        <button
          onClick={() => setActiveTool(tool.key)}
          title={collapsed ? tool.name : undefined}
          className={`flex items-center gap-3 py-2.5 pr-2 pl-3 rounded-lg text-[13px] w-full text-left whitespace-nowrap transition-all duration-200 relative border
            ${collapsed ? "justify-center !px-0" : ""}
            ${
              isActive
                ? "bg-card text-accent font-semibold shadow-sm border-border/80"
                : "border-transparent text-text-secondary hover:bg-card hover:text-text-primary hover:shadow-sm hover:border-border/80"
            }`}
        >
          {isActive && <span className="absolute left-0 top-1 bottom-1 w-[4px] bg-accent rounded-r-full" />}
          <span className="text-[17px] w-6 text-center shrink-0 leading-none">{tool.icon}</span>
          {!collapsed && <span className="overflow-hidden text-ellipsis flex-1">{tool.name}</span>}
        </button>
        {showPin && !collapsed && (
          <Tooltip text={favorites.includes(tool.key) ? "取消常用" : "标记常用"}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(tool.key);
              }}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100
                ${favorites.includes(tool.key) ? "text-accent opacity-100" : "text-text-muted hover:text-accent"}`}
            >
              <PinIcon pinned={favorites.includes(tool.key)} />
            </button>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full bg-primary text-text-primary">
      <aside
        className="flex flex-col bg-secondary border-r border-border select-none shrink-0 transition-[width] duration-300 ease-in-out relative z-10"
        style={
          {
            width: sidebarW,
            paddingTop: isMac ? "1.5rem" : 0,
            WebkitAppRegion: isMac ? "drag" : undefined,
            boxShadow: "1px 0 8px rgba(0,0,0,0.04)",
          } as React.CSSProperties
        }
      >
        {!isMac && (
          <div
            className="flex items-center ml-auto mr-1.5 mt-1.5"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <button
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
              onClick={() => window.electronAPI?.window?.minimize()}
              title="最小化"
            >
              <MinimizeIcon />
            </button>
            <button
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
              onClick={() => window.electronAPI?.window?.maximize()}
              title={maximized ? "还原" : "最大化"}
            >
              {maximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
            <button
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-white hover:bg-red-500/80 transition-colors"
              onClick={() => window.electronAPI?.window?.close()}
              title="关闭"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className={`flex items-center px-4 py-8 h-[52px] ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <button
              onClick={() => setActiveTool("home")}
              className="text-[24px] font-bold text-accent tracking-wide whitespace-nowrap overflow-hidden pl-1 hover:opacity-80 transition-opacity"
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            >
              Mint
            </button>
          )}

          <button
            className={`w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-hover transition-colors shrink-0 ${!collapsed && isMac ? "ml-auto" : ""}`}
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "展开菜单" : "折叠菜单"}
          >
            {collapsed ? <SidebarExpandIcon /> : <SidebarCollapseIcon />}
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-2"
          style={isMac ? ({ WebkitAppRegion: "no-drag" } as React.CSSProperties) : undefined}
        >
          <div className="mb-1">
            {!collapsed && (
              <div className="text-[12px] font-semibold text-text-muted uppercase tracking-widest px-3 pt-4 pb-2 whitespace-nowrap flex items-center justify-between">
                <span>常用</span>
                {favoriteTools.length === 0 && <span className="text-[10px] font-normal lowercase opacity-60">空</span>}
              </div>
            )}
            {favoriteTools.map((tool) => (
              <NavTool key={tool.key} tool={tool} />
            ))}
          </div>

          <div>
            {!collapsed && (
              <div
                className="text-[12px] font-semibold text-text-muted uppercase tracking-widest px-3 pt-4 pb-2 whitespace-nowrap flex items-center justify-between cursor-pointer select-none hover:text-text-primary transition-colors"
                onClick={() => setToolboxOpen(!toolboxOpen)}
              >
                <span>工具箱</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${toolboxOpen ? "rotate-0" : "-rotate-90"}`}
                >
                  <path d="M3 4.5l3 3 3-3" />
                </svg>
              </div>
            )}
            {!collapsed &&
              toolboxOpen &&
              allTools.filter((t) => t.key !== "home").map((tool) => <NavTool key={tool.key} tool={tool} showPin />)}
          </div>
        </nav>

        <div
          className="border-t border-border px-2 py-2"
          style={isMac ? ({ WebkitAppRegion: "no-drag" } as React.CSSProperties) : undefined}
        >
          <button
            onClick={() => setActiveTool("settings")}
            className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-[13px] w-full text-left whitespace-nowrap transition-all duration-200 relative border
              ${collapsed ? "justify-center px-0" : ""}
              ${isSettings ? "bg-card text-accent font-semibold shadow-sm border-border/80" : "border-transparent text-text-secondary hover:bg-card hover:text-text-primary hover:shadow-sm hover:border-border/80"}`}
            title="设置"
          >
            {isSettings && <span className="absolute left-0 top-1 bottom-1 w-[4px] bg-accent rounded-r-full" />}
            <span className="text-[17px] w-6 text-center shrink-0 leading-none">⚙️</span>
            {!collapsed && <span className="overflow-hidden text-ellipsis">设置</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-primary">
        {active && !isSettings && (
          <div
            className="flex items-center gap-4 px-8 py-6 border-b border-border shrink-0 bg-secondary/50"
            style={isMac ? ({ WebkitAppRegion: "drag" } as React.CSSProperties) : undefined}
          >
            <span
              className="text-[26px] w-10 h-10 flex items-center justify-center bg-card rounded-xl shrink-0 shadow-sm"
              style={isMac ? ({ WebkitAppRegion: "no-drag" } as React.CSSProperties) : undefined}
            >
              {active.icon}
            </span>
            <div>
              <h1 className="text-base font-semibold text-text-primary">{active.name}</h1>
              <p className="text-xs text-text-muted mt-0.5">{active.desc}</p>
            </div>
          </div>
        )}
        {isSettings && (
          <div
            className="flex items-center gap-4 px-8 py-6 border-b border-border shrink-0 bg-secondary/50"
            style={isMac ? ({ WebkitAppRegion: "drag" } as React.CSSProperties) : undefined}
          >
            <span
              className="text-[26px] w-10 h-10 flex items-center justify-center bg-card rounded-xl shrink-0 shadow-sm"
              style={isMac ? ({ WebkitAppRegion: "no-drag" } as React.CSSProperties) : undefined}
            >
              ⚙️
            </span>
            <div>
              <h1 className="text-base font-semibold text-text-primary">设置</h1>
              <p className="text-xs text-text-muted mt-0.5">应用偏好与主题</p>
            </div>
          </div>
        )}
        <div className="flex-1 p-6 px-8 overflow-y-auto">
          {ActiveComponent && <ActiveComponent onNavigate={setActiveTool} />}
        </div>
      </main>
    </div>
  );
}
