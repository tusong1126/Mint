import { useState } from "react";
import { useFileStorage } from "../../hooks/useFileStorage";
import ConfirmDialog from "../../components/ConfirmDialog";

interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export default function Memo() {
  const [memos, setMemos] = useFileStorage<Memo[]>("memos", [
    {
      id: "default-memo",
      title: "欢迎使用备忘录",
      content: "这是你的第一条备忘录。你可以在这里记录碎片想法、灵感笔记等内容。所有数据均存储在本地，安全可控。",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month" | "year" | "lastYear">("week");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memo | null>(null);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const saveMemo = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle && !trimmedContent) return;

    if (editingId) {
      setMemos((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, title: trimmedTitle, content: trimmedContent, updatedAt: Date.now() } : m,
        ),
      );
    } else {
      const newMemo: Memo = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: trimmedTitle,
        content: trimmedContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setMemos((prev) => [newMemo, ...prev]);
    }
    resetForm();
  };

  const startEdit = (memo: Memo) => {
    setTitle(memo.title);
    setContent(memo.content);
    setEditingId(memo.id);
  };

  const deleteMemo = (id: string) => {
    if (editingId === id) resetForm();
    setMemos((prev) => prev.filter((m) => m.id !== id));
    setDeleteTarget(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      saveMemo();
    }
  };

  const getTimeRange = (filter: typeof timeFilter) => {
    const now = new Date();
    if (filter === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { start, end: Infinity };
    }
    if (filter === "week") {
      const day = now.getDay() || 7;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime();
      return { start, end: Infinity };
    }
    if (filter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { start, end: Infinity };
    }
    if (filter === "year") {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      return { start, end: Infinity };
    }
    if (filter === "lastYear") {
      const start = new Date(now.getFullYear() - 1, 0, 1).getTime();
      const end = new Date(now.getFullYear(), 0, 1).getTime();
      return { start, end };
    }
    return { start: 0, end: Infinity };
  };

  const timeFiltered =
    timeFilter === "all"
      ? memos
      : memos.filter((m) => {
          const range = getTimeRange(timeFilter);
          return m.createdAt >= range.start && m.createdAt < range.end;
        });

  const filtered = search.trim()
    ? timeFiltered.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.content.toLowerCase().includes(search.toLowerCase()),
      )
    : timeFiltered;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="flex h-[calc(100%+40px)] -m-6 ml-[-30px]">
      <div className="w-[260px] flex flex-col min-w-0 overflow-y-auto">
        <div className="px-4 pt-5 pb-3 shrink-0">
          <input
            className="w-full py-2 px-3.5 border border-border rounded-lg bg-card text-text-primary text-sm outline-none transition-all duration-200 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 placeholder:text-text-secondary/50"
            type="text"
            placeholder={`搜索 ${timeFiltered.length} 条备忘录...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="px-4 pb-3 shrink-0">
          <div className="flex bg-card rounded-lg p-1 border border-border/50">
            {(["all", "today", "week", "month", "year", "lastYear"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200
                    ${
                      timeFilter === f
                        ? "bg-primary text-accent shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-hover"
                    }`}
              >
                {{ all: "全部", today: "今天", week: "本周", month: "本月", year: "今年", lastYear: "去年" }[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center">
                <span className="text-4xl block mb-3 opacity-30">📒</span>
                <span className="text-text-muted text-sm">
                  {memos.length === 0 ? "暂无备忘录，去创建一条吧" : "没有匹配的备忘录"}
                </span>
              </div>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-3 pt-1">
                {filtered.map((memo) => (
                  <li
                    key={memo.id}
                    onMouseEnter={() => setHoveredId(memo.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="bg-card rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 group overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-sm font-semibold text-text-primary flex-1 break-words text-ellipsis whitespace-nowrap overflow-hidden">
                          {memo.title || "无标题"}
                        </h3>
                        <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0 mt-0.5">
                          {formatDate(memo.createdAt)}
                        </span>
                      </div>
                      {memo.content && (
                        <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
                          {memo.content}
                        </p>
                      )}
                      {memo.updatedAt !== memo.createdAt && (
                        <span className="text-[10px] text-text-muted/60 mt-2 block">
                          已编辑 {formatDate(memo.updatedAt)}
                        </span>
                      )}
                    </div>
                    {hoveredId === memo.id && (
                      <div className="flex border-t border-border/30">
                        <button
                          onClick={() => startEdit(memo)}
                          className="flex-1 py-2 text-[12px] text-text-secondary hover:text-accent hover:bg-hover transition-colors cursor-pointer"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => setDeleteTarget(memo)}
                          className="flex-1 py-2 text-[12px] text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer border-l border-border/30"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-xs text-text-muted text-center">共 {memos.length} 条备忘录</div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 shrink-0 bg-secondary border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            {editingId ? "编辑备忘录" : "新建备忘录"}
          </h3>
          <input
            className="w-full py-2 px-3 border border-border rounded-lg bg-card text-text-primary text-sm outline-none transition-all duration-200 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 placeholder:text-text-secondary/50 mb-2.5"
            type="text"
            placeholder="标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <textarea
            className="w-full py-2 px-3 border border-border rounded-lg bg-card text-text-primary text-sm outline-none transition-all duration-200 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 placeholder:text-text-secondary/50 resize-none"
            rows={6}
            placeholder="内容... (⌘/Ctrl+Enter)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-2 mt-3">
            <button
              className="flex-1 py-2 rounded-lg bg-accent text-white text-xs font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-sm active:scale-[0.97]"
              onClick={saveMemo}
            >
              {editingId ? "更新" : "保存"}
            </button>
            {editingId && (
              <button
                className="flex-1 py-2 rounded-lg border border-border text-text-secondary text-xs font-semibold cursor-pointer transition-all duration-200 hover:bg-hover active:scale-[0.97]"
                onClick={resetForm}
              >
                取消
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[11px] text-text-muted leading-relaxed">
            在左侧填写标题和内容后保存，所有备忘录将显示在右侧列表中。
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除备忘录"
        message={`确定要删除「${deleteTarget?.title || "无标题"}」吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={() => deleteTarget && deleteMemo(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
