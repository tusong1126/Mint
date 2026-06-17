import { useState, useEffect } from "react";
import HomePage from "./tools/HomePage";
import TodoList from "./tools/TodoList";
import MarkdownTool from "./tools/MarkdownTool";
import Settings from "./tools/Settings";

interface Tool {
  key: string;
  name: string;
  icon: string;
  desc: string;
  component: React.ComponentType<{ onNavigate?: (key: string) => void }>;
}

interface ToolCategory {
  name: string;
  tools: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    name: "常用",
    tools: [
      { key: "home", name: "首页", icon: "🏠", desc: "应用概览", component: HomePage },
      { key: "todolist", name: "待办事项", icon: "📋", desc: "管理日常任务", component: TodoList },
    ],
  },
  {
    name: "写作",
    tools: [{ key: "markdown", name: "Markdown", icon: "📝", desc: "编写与预览文档", component: MarkdownTool }],
  },
];

const SIDEBAR_W = 210;
const SIDEBAR_COLLAPSED = 52;

export default function App() {
  const [activeTool, setActiveTool] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const isMac = window.electronAPI?.platform === "darwin";

  useEffect(() => {
    if (!isMac && window.electronAPI?.window) {
      window.electronAPI.window.isMaximized().then(setMaximized);
      window.electronAPI.window.onMaximized(setMaximized);
    }
  }, [isMac]);

  const allTools = toolCategories.flatMap((c) => c.tools);
  const active = allTools.find((t) => t.key === activeTool);
  const isSettings = activeTool === "settings";
  const ActiveComponent = isSettings ? Settings : active?.component;

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W;

  return (
    <div className="flex h-full bg-primary text-text-primary">
      <aside
        className="flex flex-col bg-secondary border-r border-border select-none shrink-0 transition-[width] duration-200 relative"
        style={{ width: sidebarW }}
      >
        <div
          className="flex items-center justify-between px-2 py-4 h-[52px]"
          style={{ marginTop: isMac ? "1.5rem" : 0, WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          {!collapsed && (
            <span className="text-[15px] font-bold text-accent tracking-wide whitespace-nowrap overflow-hidden pl-2">
              Mint
            </span>
          )}
          {!isMac && (
            <div className="flex items-center gap-0.5 ml-auto" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-hover text-xs"
                onClick={() => window.electronAPI?.window?.minimize()}
                title="最小化"
              >
                &#x2014;
              </button>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-hover text-xs"
                onClick={() => window.electronAPI?.window?.maximize()}
                title={maximized ? "还原" : "最大化"}
              >
                {maximized ? "❐" : "□"}
              </button>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-white hover:bg-red-500 text-xs"
                onClick={() => window.electronAPI?.window?.close()}
                title="关闭"
              >
                ✕
              </button>
            </div>
          )}
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-hover text-xs shrink-0"
            style={{ WebkitAppRegion: "no-drag", marginLeft: isMac ? "auto" : 0 } as React.CSSProperties}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "展开菜单" : "折叠菜单"}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5">
          {toolCategories.map((cat) => (
            <div key={cat.name} className="mb-1">
              {!collapsed && (
                <div className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-3 pt-3 pb-1.5 whitespace-nowrap">
                  {cat.name}
                </div>
              )}
              {cat.tools.map((tool) => (
                <button
                  key={tool.key}
                  onClick={() => setActiveTool(tool.key)}
                  title={collapsed ? tool.name : undefined}
                  className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-[13px] w-full text-left whitespace-nowrap transition-colors duration-150
                    ${collapsed ? "justify-center px-0" : ""}
                    ${
                      activeTool === tool.key
                        ? "bg-card text-accent font-semibold"
                        : "text-text-secondary hover:bg-card hover:text-text-primary"
                    }`}
                >
                  <span className="text-[17px] w-6 text-center shrink-0 leading-none">{tool.icon}</span>
                  {!collapsed && <span className="overflow-hidden text-ellipsis">{tool.name}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-border">
          <button
            onClick={() => setActiveTool("settings")}
            className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-[13px] w-full text-left whitespace-nowrap transition-colors duration-150
              ${collapsed ? "justify-center px-0" : ""}
              ${isSettings ? "bg-card text-accent font-semibold" : "text-text-secondary hover:bg-card hover:text-text-primary"}`}
            title="设置"
          >
            <span className="text-[17px] w-6 text-center shrink-0 leading-none">⚙️</span>
            {!collapsed && <span className="overflow-hidden text-ellipsis">设置</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        {active && !isSettings && (
          <div className="flex items-center gap-3.5 px-8 py-7 border-b border-border shrink-0">
            <span className="text-[28px] w-11 h-11 flex items-center justify-center bg-card rounded-xl shrink-0">
              {active.icon}
            </span>
            <div>
              <h1 className="text-lg font-bold text-text-primary">{active.name}</h1>
              <p className="text-xs text-text-muted mt-0.5">{active.desc}</p>
            </div>
          </div>
        )}
        {isSettings && (
          <div className="flex items-center gap-3.5 px-8 py-7 border-b border-border shrink-0">
            <span className="text-[28px] w-11 h-11 flex items-center justify-center bg-card rounded-xl shrink-0">
              ⚙️
            </span>
            <div>
              <h1 className="text-lg font-bold text-text-primary">设置</h1>
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
