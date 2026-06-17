import { useState } from "react";
import type { ClipboardRecord } from "./hooks";
import Tooltip from "../../components/Tooltip";

interface Props {
  record: ClipboardRecord;
  onCopy: (record: ClipboardRecord) => void;
  onPaste: (record: ClipboardRecord) => void;
  onPreview: (record: ClipboardRecord) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="4.5" width="8" height="8" rx="1" />
      <path d="M9.5 4.5v-1a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1" />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 3.5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1" />
      <path d="M6 3.5h4a1 1 0 0 1 1 1v1" />
      <path d="M6 2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1H6v-1z" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10.3l-3.6 1.9.7-4L1.2 5.2l4-.6L7 1z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3.5h10" />
      <path d="M4.5 3.5V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
      <path d="M11 3.5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8" />
    </svg>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClipboardItem({
  record,
  onCopy,
  onPaste,
  onPreview,
  onToggleFavorite,
  onDelete,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(record);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isImage = record.type === "image";
  const isFile = record.type === "file";

  const handleClick = async (e: React.MouseEvent) => {
    if (isFile && record.filePath) {
      e.stopPropagation();
      const api = (window as any).electronAPI;
      const result = await api?.clipboard?.openFileLocation(record.filePath);
      if (result && result !== 'ok') {
        console.error('[clipboard] openFileLocation:', result);
      }
    } else {
      onPreview(record);
    }
  };

  return (
    <div
      className={`group relative bg-card rounded-xl border border-border/50 p-4 transition-all duration-200 hover:shadow-md hover:border-accent/20 ${record.favorite ? "ring-1 ring-accent/20" : ""}`}
    >
      <div className="flex items-start gap-3 cursor-pointer" onClick={handleClick}>
        <div className="flex-1 min-w-0">
          {isFile && record.thumbnail ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/50 shrink-0 flex items-center justify-center">
                <img src={record.thumbnail} alt={record.content} className="w-6 h-6 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-text-primary truncate">{record.content}</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  文件 • {isFile && record.filePath ? record.filePath.split("/").pop() : ""}
                </div>
              </div>
            </div>
          ) : isImage && record.thumbnail ? (
            <div className="rounded-lg overflow-hidden bg-secondary/50 mb-2 max-w-[300px]">
              <img
                src={record.thumbnail}
                alt="剪贴板图片"
                className="max-h-[200px] w-auto object-contain"
                style={{ imageRendering: "auto" }}
              />
            </div>
          ) : (
            <div className="text-[13px] text-text-primary leading-relaxed break-all whitespace-pre-wrap line-clamp-3">
              {record.content}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-text-muted">{formatTime(record.createdAt)}</span>
            {(isImage || isFile) && record.imageWidth && record.imageHeight && (
              <span className="text-[10px] text-text-muted/60">
                {record.imageWidth}×{record.imageHeight}
              </span>
            )}
            {record.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
                {record.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip text="复制">
            <button
              onClick={handleCopy}
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
            >
              {copied ? <span className="text-[10px] font-semibold text-accent">✓</span> : <CopyIcon />}
            </button>
          </Tooltip>
          <Tooltip text="粘贴">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPaste(record);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
            >
              <PasteIcon />
            </button>
          </Tooltip>
          <Tooltip text={record.favorite ? "取消收藏" : "收藏"}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(record.id);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${record.favorite ? "text-accent" : "text-text-muted hover:text-accent hover:bg-accent/10"}`}
            >
              <StarIcon filled={record.favorite} />
            </button>
          </Tooltip>
          <Tooltip text="删除">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record.id);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <TrashIcon />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
