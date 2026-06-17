import { useState } from 'react'
import { useFileStorage } from '../../hooks/useFileStorage'
import type { Todo, FilterType } from './types'

export default function TodoList() {
  const [todos, setTodos] = useFileStorage<Todo[]>('todos', [])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    const newTodo: Todo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      completed: false,
      createdAt: Date.now(),
    }
    setTodos((prev) => [newTodo, ...prev])
    setInput('')
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTodo()
  }

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.filter((t) => t.completed).length

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `全部 (${todos.length})` },
    { key: 'active', label: `待完成 (${activeCount})` },
    { key: 'completed', label: `已完成 (${completedCount})` },
  ]

  return (
    <div className="max-w-[560px] mx-auto">
      <div className="flex gap-2 mb-5">
        <input
          className="flex-1 py-2.5 px-3.5 border border-border rounded-lg bg-card text-text-primary text-sm outline-none transition-colors duration-150 focus:border-accent placeholder:text-text-secondary/50"
          type="text"
          placeholder="添加新的待办事项..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          className="py-2.5 px-5 rounded-lg bg-accent text-secondary text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-accent-hover whitespace-nowrap"
          onClick={addTodo}
        >
          添加
        </button>
      </div>

      <div className="flex gap-1 mb-4 bg-card rounded-lg p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs transition-colors duration-150
              ${filter === f.key
                ? 'bg-primary text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-text-secondary/60 text-[13px]">
          {filter === 'all' ? '暂无待办事项，添加一个吧' : filter === 'active' ? '所有事项已完成' : '暂无已完成事项'}
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {filtered.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 p-3 px-3.5 bg-card rounded-lg border border-transparent hover:border-border transition-colors duration-150 group"
            >
              <div
                role="checkbox"
                aria-checked={todo.completed}
                tabIndex={0}
                onClick={() => toggleTodo(todo.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTodo(todo.id) }}
                className={`w-[18px] h-[18px] border-2 rounded-full cursor-pointer shrink-0 flex items-center justify-center transition-all duration-150
                  ${todo.completed
                    ? 'bg-success border-success'
                    : 'border-border hover:border-accent'
                  }`}
              >
                {todo.completed && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary" />
                  </svg>
                )}
              </div>
              <span
                className={`flex-1 text-sm break-words ${todo.completed ? 'line-through text-text-secondary/60' : 'text-text-primary'}`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="py-1 px-2 rounded-md text-text-secondary text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-danger hover:text-secondary shrink-0"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}

      {todos.length > 0 && (
        <div className="mt-3.5 text-xs text-text-secondary text-center">
          共 {todos.length} 项，{activeCount} 项待完成
        </div>
      )}
    </div>
  )
}