import { useState } from "react";
import { useFileStorage } from "../../hooks/useFileStorage";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { Todo, FilterType } from "./types";

export default function TodoList() {
  const [todos, setTodos] = useFileStorage<Todo[]>("todos", [
    {
      id: "default-todo",
      text: "欢迎使用 Mint！试试勾选或添加待办事项",
      completed: false,
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setDeleteTarget(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTodo();
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: `全部 (${todos.length})` },
    { key: "active", label: `待完成 (${activeCount})` },
    { key: "completed", label: `已完成 (${completedCount})` },
  ];

  return (
    <div className="max-w-[560px] mx-auto">
      <div className="flex gap-2 mb-5">
        <input
          className="flex-1 py-2.5 px-3.5 border border-border rounded-lg bg-card text-text-primary text-sm outline-none transition-all duration-200 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 placeholder:text-text-secondary/50"
          type="text"
          placeholder="添加新的待办事项..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          className="py-2.5 px-5 rounded-lg bg-accent text-white text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-sm active:scale-[0.97] whitespace-nowrap"
          onClick={addTodo}
        >
          添加
        </button>
      </div>

      <div className="flex gap-1 mb-5 bg-card rounded-lg p-1 border border-border/50">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200
              ${
                filter === f.key
                  ? "bg-primary text-accent shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-hover"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary/50 text-[13px] bg-card/50 rounded-xl border border-dashed border-border">
          {filter === "all" ? "暂无待办事项，添加一个吧" : filter === "active" ? "所有事项已完成 🎉" : "暂无已完成事项"}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 p-3.5 px-4 bg-card rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 group"
            >
              <div
                role="checkbox"
                aria-checked={todo.completed}
                tabIndex={0}
                onClick={() => toggleTodo(todo.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggleTodo(todo.id);
                }}
                className={`w-[20px] h-[20px] border-2 rounded-full cursor-pointer shrink-0 flex items-center justify-center transition-all duration-200
                  ${todo.completed ? "bg-success border-success" : "border-text-muted/40 hover:border-accent/60"}`}
              >
                {todo.completed && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`flex-1 text-sm break-words transition-all duration-200 ${todo.completed ? "line-through text-text-secondary/40" : "text-text-primary"}`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => setDeleteTarget(todo)}
                className="py-1 px-2 rounded-md text-text-muted text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-danger/10 hover:text-danger shrink-0"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}

      {todos.length > 0 && (
        <div className="mt-4 text-xs text-text-muted text-center">
          共 {todos.length} 项，{activeCount} 项待完成
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除待办"
        message={`确定要删除「${deleteTarget?.text}」吗？`}
        confirmText="删除"
        onConfirm={() => deleteTarget && deleteTodo(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
