import { useState } from "react";
import { useFileStorage } from "../../hooks/useFileStorage";
import ConfirmDialog from "../../components/ConfirmDialog";

interface Task {
  id: string;
  title: string;
  column: string;
  createdAt: number;
}

const COLUMNS = [
  { key: "todo", label: "待办", icon: "📋", color: "bg-amber-400/10 text-amber-500" },
  { key: "doing", label: "进行中", icon: "🔄", color: "bg-blue-400/10 text-blue-500" },
  { key: "done", label: "已完成", icon: "✅", color: "bg-emerald-400/10 text-emerald-500" },
];

const DEFAULT_TASKS: Task[] = [
  { id: "default-1", title: "规划功能模块", column: "todo", createdAt: Date.now() - 86400000 },
  { id: "default-2", title: "搭建项目架构", column: "doing", createdAt: Date.now() - 7200000 },
  { id: "default-3", title: "配置开发环境", column: "done", createdAt: Date.now() - 172800000 },
  { id: "default-4", title: "需求文档评审", column: "done", createdAt: Date.now() - 259200000 },
];

export default function TaskBoard() {
  const [tasks, setTasks] = useFileStorage<Task[]>("tasks", DEFAULT_TASKS);
  const [input, setInput] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const addTask = (column: string) => {
    const title = input.trim();
    if (!title) return;
    const newTask: Task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      column,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setInput("");
  };

  const moveTask = (taskId: string, targetColumn: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, column: targetColumn } : t)));
  };

  const getColumnTasks = (column: string) => tasks.filter((t) => t.column === column);

  return (
    <div className="flex flex-col h-full">
      {/* Quick add */}
      <div className="flex items-center gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) addTask("todo");
          }}
          placeholder="快速添加任务到「待办」..."
          className="flex-1 h-9 px-4 bg-card border border-border/50 rounded-lg text-sm text-text-primary placeholder-text-muted/50 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
        />
        <button
          onClick={() => input.trim() && addTask("todo")}
          className="h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors active:scale-[0.97]"
        >
          添加
        </button>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-2 min-h-0">
        {COLUMNS.map((col) => {
          const columnTasks = getColumnTasks(col.key);
          return (
            <div
              key={col.key}
              className={`flex-1 min-w-[220px] bg-secondary/30 rounded-xl border border-border/30 flex flex-col transition-all duration-200 ${dragOver === col.key ? "border-accent/40 bg-accent/[0.02]" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("taskId");
                if (id) moveTask(id, col.key);
                setDragOver(null);
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.color}`}>
                    {col.icon} {col.label}
                  </span>
                  <span className="text-xs text-text-muted bg-card px-1.5 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Task list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-text-muted/40 text-xs">暂无任务</div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("taskId", task.id);
                        e.currentTarget.classList.add("opacity-40");
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove("opacity-40");
                      }}
                      className="group bg-card rounded-lg border border-border/40 p-3 cursor-grab active:cursor-grabbing hover:border-accent/30 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-text-primary leading-relaxed break-words flex-1">
                          {task.title}
                        </span>
                        <button
                          onClick={() => setDeleteTarget(task)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all text-xs shrink-0 mt-0.5"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {COLUMNS.filter((c) => c.key !== task.column).map((c) => (
                          <button
                            key={c.key}
                            onClick={() => moveTask(task.id, c.key)}
                            className="text-[10px] px-1.5 py-0.5 rounded text-text-muted hover:bg-hover transition-colors"
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="删除任务"
          message={`确定删除「${deleteTarget.title}」？`}
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
