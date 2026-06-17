import { useState, useEffect, useRef, useCallback } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown as cmMarkdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import Tooltip from "../../components/Tooltip";
import ConfirmDialog from "../../components/ConfirmDialog";

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  }),
);

marked.setOptions({ breaks: true, gfm: true });

interface FileInfo {
  name: string;
  filename: string;
  mtime: number;
}

const cmTheme = EditorView.theme(
  {
    "&": { height: "100%" },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
      fontSize: "13px",
    },
    ".cm-content": { padding: "0", minHeight: "100%" },
    ".cm-gutters": { display: "none" },
    ".cm-activeLine": { background: "var(--bg-hover) !important" },
    ".cm-activeLineGutter": { background: "transparent" },
    ".cm-cursor": { borderLeftColor: "var(--accent) !important" },
    ".cm-selectionBackground": { background: "var(--accent) !important", opacity: 0.25 },
    ".cm-focused": { outline: "none" },
  },
  { dark: true },
);

const api = () => (window as any).electronAPI?.markdown;

const defaultName = "欢迎使用";
const defaultFilename = "欢迎使用.md";
const defaultContent = `# 欢迎使用 Markdown 🎉

这是你的第一个 Markdown 文档。Markdown 是一种轻量级标记语言，让你专注于内容本身。

---

## 文本样式

- **粗体** 和 *斜体* 以及 ~~删除线~~
- \`行内代码\` 用于强调代码片段
- 上标^注^ 和 下标~2~

## 代码块

\`\`\`javascript
function greet(name) {
  // 这是一段 JavaScript 代码
  const msg = \`你好，\${name}！\`;
  console.log(msg);
  return msg;
}

greet("Mint");
\`\`\`

\`\`\`python
def fibonacci(n):
    """生成斐波那契数列"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print(list(fibonacci(10)))
\`\`\`

\`\`\`css
.card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--shadow);
}
\`\`\`

## 引用与列表

> 这是引用的文字样式，用于突出重要内容或引用他人话语。
> 多行引用会自动合并显示。

### 无序列表

- 备忘录 — 记录碎片想法
- 待办事项 — 管理日常任务
- Markdown — 编写与预览文档

### 有序列表

1. 打开 Mint 应用
2. 选择左侧边栏的工具
3. 开始记录你的想法

### 嵌套列表

- 前端技术
  - HTML / CSS
  - JavaScript / TypeScript
  - 框架
    - React
    - Vue
- 后端技术
  - Node.js
  - Python

## 表格

| 功能 | 说明 | 状态 |
|------|------|------|
| 实时预览 | 右侧同步渲染 HTML | ✅ |
| 语法高亮 | 支持多种编程语言 | ✅ |
| 自动保存 | 输入即存，无需手动操作 | ✅ |
| 工具栏 | 快速插入 Markdown 格式 | ✅ |

## 任务列表

- [x] 熟悉 Markdown 语法
- [x] 编写示例文档
- [ ] 尝试更多功能
- [ ] 创建自己的文档
---

> 💡 **提示**：你可以删除此文档，或基于它开始编写自己的内容。所有文档存储在本地，安全可控。
`;

export default function Markdown() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const [content, setContent] = useState("");
  const [html, setHtml] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const initRef = useRef(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const headingRef = useRef<HTMLButtonElement>(null);
  const [headingOpen, setHeadingOpen] = useState(false);
  const [headingPos, setHeadingPos] = useState<{ x: number; y: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileInfo | null>(null);

  const toggleHeading = () => {
    if (!headingOpen) {
      const rect = headingRef.current?.getBoundingClientRect();
      if (rect) {
        setHeadingPos({ x: rect.left, y: rect.bottom + 4 });
      }
    }
    setHeadingOpen(!headingOpen);
  };

  useEffect(() => {
    if (!headingOpen) return;
    const handler = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setHeadingOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [headingOpen]);

  const insertAtCursor = useCallback((before: string, after: string = "") => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const insert = before + selected + after;
    view.dispatch(
      view.state.update({
        changes: { from, to, insert },
        selection: EditorSelection.cursor(from + before.length + selected.length + after.length),
      }),
    );
    view.focus();
  }, []);

  const toolbarActions = [
    { label: "粗体(B)", title: "粗体", action: () => insertAtCursor("**", "**") },
    { label: "斜体(I)", title: "斜体", action: () => insertAtCursor("*", "*") },
    { label: "删除线(S)", title: "删除线", action: () => insertAtCursor("~~", "~~") },
    { type: "separator" as const },
    { label: "链接(🔗)", title: "链接", action: () => insertAtCursor("[", "](url)") },
    { label: "图片(🖼)", title: "图片", action: () => insertAtCursor("![alt](", ")") },
    { label: "代码(`)", title: "行内代码", action: () => insertAtCursor("`", "`") },
    { label: "代码块(```)", title: "代码块", action: () => insertAtCursor("```\n", "\n```") },
    { type: "separator" as const },
    { label: "列表(•)", title: "无序列表", action: () => insertAtCursor("- ", "") },
    { label: "序号(1.)", title: "有序列表", action: () => insertAtCursor("1. ", "") },
    { label: "引用(>)", title: "引用", action: () => insertAtCursor("> ", "") },
    { label: "分隔线(―)", title: "分割线", action: () => insertAtCursor("\n---\n", "") },
    { type: "separator" as const },
    { label: "表格(⊞)", title: "表格", action: () => insertAtCursor("\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n", "") },
    { label: "任务(☐)", title: "任务列表", action: () => insertAtCursor("- [ ] ", "") },
  ];

  const openFile = useCallback(async (filename: string, name: string) => {
    const md = api();
    if (!md) return;
    const text = await md.read(filename);
    setActiveFile(filename);
    setActiveName(name);
    setContent(text);
    setHtml(marked.parse(text) as string);
  }, []);

  const loadFiles = useCallback(async () => {
    const md = api();
    if (!md) return;
    const list = await md.list();
    if (list.length === 0 && !initRef.current) {
      initRef.current = true;
      await md.write(defaultFilename, defaultContent);
      const updated = await md.list();
      setFiles(updated);
      openFile(defaultFilename, defaultName);
    } else {
      setFiles(list);
      if (!initRef.current && list.length === 1 && list[0].filename === defaultFilename) {
        initRef.current = true;
        await md.write(defaultFilename, defaultContent);
        openFile(defaultFilename, defaultName);
      }
    }
  }, [openFile]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const saveFile = useCallback(
    async (filename: string, text: string) => {
      const md = api();
      if (!md) return;
      await md.write(filename, text);
      setHtml(marked.parse(text) as string);
      loadFiles();
    },
    [loadFiles],
  );

  const handleChange = useCallback(
    (val: string) => {
      setContent(val);
      if (!activeFile) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveFile(activeFile, val);
      }, 500);
    },
    [activeFile, saveFile],
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const filename = `${name}.md`;
    const md = api();
    if (!md) return;
    await md.write(filename, "# " + name + "\n\n");
    setCreating(false);
    setNewName("");
    await loadFiles();
    openFile(filename, name);
  };

  const handleDelete = async (filename: string) => {
    const md = api();
    if (!md) return;
    await md.delete(filename);
    if (activeFile === filename) {
      setActiveFile(null);
      setActiveName("");
      setContent("");
      setHtml("");
    }
    await loadFiles();
    setDeleteTarget(null);
  };

  const hasApi = !!api();

  return (
    <div className="flex h-[calc(100%+40px)] -m-6 ml-[-32px]">
      <div className="w-48 shrink-0 bg-secondary border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <button
            onClick={() => {
              setCreating(true);
              setNewName("");
            }}
            className="w-full py-2 px-3 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover hover:shadow-sm transition-all duration-200 active:scale-[0.97]"
          >
            + 新建文档
          </button>
        </div>

        {creating && (
          <div className="p-2 border-b border-border">
            <input
              className="w-full py-1.5 px-2.5 rounded-md bg-card border border-border text-text-primary text-xs outline-none transition-all duration-200 focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
              placeholder="文档名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setCreating(false);
              }}
              autoFocus
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {!hasApi ? (
            <p className="text-xs text-text-muted p-2">需 Electron 环境</p>
          ) : files.length === 0 ? (
            <p className="text-xs text-text-muted p-2">暂无文档</p>
          ) : (
            files.map((f) => (
              <div
                key={f.filename}
                onClick={() => openFile(f.filename, f.name)}
                className={`group flex items-center justify-between py-2 px-2.5 rounded-md text-xs cursor-pointer transition-all duration-200
                  ${activeFile === f.filename ? "bg-card/80 text-accent font-semibold shadow-sm" : "text-text-secondary hover:bg-card/50 hover:text-text-primary"}`}
              >
                <span className="truncate flex-1">📄 {f.name}</span>
                <Tooltip text="删除">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(f);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger ml-1 shrink-0 transition-all duration-200 p-0.5"
                  >
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
                  </button>
                </Tooltip>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除文档"
        message={`确定要删除文档「${deleteTarget?.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.filename)}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      <div className="flex-1 flex flex-col min-w-0">
        {!activeFile ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl block mb-3 opacity-30">📝</span>
              <span className="text-text-muted text-sm">
                {hasApi ? "选择或新建一个 Markdown 文档" : "Markdown 编辑器需在 Electron 中运行"}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0 bg-secondary/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">{activeName}.md</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success" title="已保存" />
              </div>
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                自动保存
              </span>
            </div>
            {activeFile && (
              <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border shrink-0 bg-secondary/30 overflow-x-auto">
                <button
                  ref={headingRef}
                  onClick={toggleHeading}
                  className="py-1 px-2 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-card/60 transition-all duration-150 shrink-0"
                >
                  标题 ▼
                </button>
                {headingOpen && headingPos && (
                  <div
                    className="fixed py-1 rounded-md bg-card border border-border shadow-lg z-[9999] min-w-[80px]"
                    style={{ left: headingPos.x, top: headingPos.y }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          insertAtCursor("#".repeat(n) + " ", "");
                          setHeadingOpen(false);
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-card/60 transition-all duration-100"
                      >
                        {`H${n}`}
                      </button>
                    ))}
                  </div>
                )}
                {toolbarActions.map((item, i) =>
                  item.type === "separator" ? (
                    <div key={i} className="w-px h-5 bg-border mx-1 shrink-0" />
                  ) : (
                    <Tooltip key={i} text={item.title}>
                      <button
                        onClick={item.action}
                        className="py-1 px-2 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-card/60 transition-all duration-150 shrink-0"
                      >
                        {item.label}
                      </button>
                    </Tooltip>
                  ),
                )}
              </div>
            )}
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 border-r border-border overflow-hidden">
                <div className="h-full" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
                  <CodeMirror
                    ref={editorRef}
                    value={content}
                    onChange={handleChange}
                    extensions={[cmMarkdown(), cmTheme]}
                    basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: true }}
                    style={{ height: "100%" }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="markdown-preview p-6 text-sm" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
