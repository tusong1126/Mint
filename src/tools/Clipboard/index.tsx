import { useState, useMemo, useCallback } from "react";
import ClipboardItem from "./Item";
import PreviewModal from "./PreviewModal";
import type { ClipboardRecord } from "./hooks";
import { useClipboardRecords, useCategories, useClipboardWatcher } from "./hooks";

const BUILTIN_FILTERS = [
  { key: "", label: "全部" },
  { key: "text", label: "文字" },
  { key: "image", label: "图片" },
  { key: "file", label: "文件" },
  { key: "favorite", label: "收藏" },
] as const;

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export default function Clipboard() {
  const { records, addRecord, toggleFavorite, deleteRecord, loaded } = useClipboardRecords();
  const { categories, removeCategory } = useCategories(records);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useClipboardWatcher(addRecord);

  const [previewRecord, setPreviewRecord] = useState<ClipboardRecord | null>(null);

  const handlePreview = useCallback((record: ClipboardRecord) => {
    setPreviewRecord(record);
  }, []);

  const copyToClipboard = useCallback((record: ClipboardRecord) => {
    const api = (window as any).electronAPI;
    if (record.type === "image") {
      api?.clipboard?.copyImage(record.imagePath);
    } else if (api?.clipboard?.write) {
      api.clipboard.write(record.content);
    } else {
      navigator.clipboard?.writeText(record.content);
    }
  }, []);

  const pasteText = useCallback((record: ClipboardRecord) => {
    const api = (window as any).electronAPI;
    if (!api?.clipboard) return;
    if (record.type === "image") {
      api.clipboard.copyImage(record.imagePath).then(() => {
        setTimeout(() => api.clipboard.paste(), 80);
      });
    } else {
      api.clipboard.write(record.content);
      setTimeout(() => api.clipboard.paste(), 80);
    }
  }, []);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { "": records.length };
    for (const r of records) {
      if (r.type === "text") counts.text = (counts.text || 0) + 1;
      if (r.type === "image") counts.image = (counts.image || 0) + 1;
      if (r.type === "file") counts.file = (counts.file || 0) + 1;
      if (r.favorite) counts.favorite = (counts.favorite || 0) + 1;
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .filter((r) => {
        if (activeCategory === "text") return r.type === "text";
        if (activeCategory === "image") return r.type === "image";
        if (activeCategory === "file") return r.type === "file";
        if (activeCategory === "favorite") return r.favorite;
        if (activeCategory) return r.category === activeCategory;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        return r.content.toLowerCase().includes(q);
      });
  }, [records, search, activeCategory]);

  const favorites = useMemo(() => filtered.filter((r) => r.favorite), [filtered]);
  const history = useMemo(() => filtered.filter((r) => !r.favorite), [filtered]);

  if (!loaded) {
    return <div className="flex items-center justify-center h-40 text-text-muted text-sm">加载中...</div>;
  }

  return (
    <div className="max-w-[860px] mx-auto space-y-5 pb-8">
      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索剪贴板内容..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border text-[13px] text-text-primary placeholder:text-text-muted/50 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <span className="text-[11px] text-text-muted whitespace-nowrap">
          {records.length}/{500}
        </span>
      </div>

      {/* Categories & Add */}
      <div className="flex flex-wrap items-center gap-1.5">
        {BUILTIN_FILTERS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setActiveCategory(activeCategory === opt.key ? "" : opt.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
              activeCategory === opt.key
                ? "bg-accent text-white border-accent"
                : "bg-card text-text-secondary border-border/60 hover:border-accent/30 hover:text-accent"
            }`}
          >
            {opt.label}
              <span className={`ml-1.5 tabular-nums ${activeCategory === opt.key ? "text-white/70" : "text-text-muted"}`}>
                {filterCounts[opt.key] ?? 0}
              </span>
          </button>
        ))}
        {categories.map((cat) => (
          <div key={cat} className="group relative">
            <button
              onClick={() => setActiveCategory(activeCategory === cat ? "" : cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-accent text-white border-accent"
                  : "bg-card text-text-secondary border-border/60 hover:border-accent/30 hover:text-accent"
              }`}
            >
              {cat}
              <span className={`ml-1.5 tabular-nums ${activeCategory === cat ? "text-white/70" : "text-text-muted"}`}>
                {filterCounts[cat] || 0}
              </span>
            </button>
            <button
              onClick={() => removeCategory(cat)}
              className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
              title="删除分类"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <h3 className="text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="text-accent">★</span> 收藏 ({favorites.length})
          </h3>
          <div className="space-y-2">
            {favorites.map((r) => (
              <ClipboardItem
                key={r.id}
                record={r}
                onCopy={copyToClipboard}
                onPaste={pasteText}
                onPreview={handlePreview}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteRecord}
              />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          {favorites.length > 0 && (
            <h3 className="text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3">
              历史记录 ({history.length})
            </h3>
          )}
          <div className="space-y-2">
            {history.map((r) => (
              <ClipboardItem
                key={r.id}
                record={r}
                onCopy={copyToClipboard}
                onPaste={pasteText}
                onPreview={handlePreview}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteRecord}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && records.length === 0 && (
        <EmptyState icon="📋" text="剪切板为空，复制任意内容后将自动记录" />
      )}
      {filtered.length === 0 && records.length > 0 && <EmptyState icon="🔍" text="没有匹配的内容，试试其他关键词" />}

      <PreviewModal
        record={previewRecord}
        onClose={() => setPreviewRecord(null)}
        onCopy={copyToClipboard}
        onPaste={pasteText}
      />
    </div>
  );
}
