import { useState, useEffect, useRef, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown as cmMarkdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    },
  }),
)

marked.setOptions({ breaks: true, gfm: true })

interface FileInfo {
  name: string
  filename: string
  mtime: number
}

const cmTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace", fontSize: '13px' },
  '.cm-content': { padding: '0', minHeight: '100%' },
  '.cm-gutters': { display: 'none' },
  '.cm-activeLine': { background: 'var(--bg-hover) !important' },
  '.cm-activeLineGutter': { background: 'transparent' },
  '.cm-cursor': { borderLeftColor: 'var(--accent) !important' },
  '.cm-selectionBackground': { background: 'var(--accent) !important', opacity: 0.25 },
  '.cm-focused': { outline: 'none' },
}, { dark: true })

const api = () => (window as any).electronAPI?.markdown

export default function MarkdownTool() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [activeName, setActiveName] = useState('')
  const [content, setContent] = useState('')
  const [html, setHtml] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  const loadFiles = useCallback(async () => {
    const md = api()
    if (!md) return
    const list = await md.list()
    setFiles(list)
  }, [])

  useEffect(() => { loadFiles() }, [loadFiles])

  const openFile = useCallback(async (filename: string, name: string) => {
    const md = api()
    if (!md) return
    const text = await md.read(filename)
    setActiveFile(filename)
    setActiveName(name)
    setContent(text)
    setHtml(marked.parse(text) as string)
  }, [])

  const saveFile = useCallback(async (filename: string, text: string) => {
    const md = api()
    if (!md) return
    await md.write(filename, text)
    setHtml(marked.parse(text) as string)
    loadFiles()
  }, [loadFiles])

  const handleChange = useCallback((val: string) => {
    setContent(val)
    if (!activeFile) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveFile(activeFile, val)
    }, 500)
  }, [activeFile, saveFile])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const filename = `${name}.md`
    const md = api()
    if (!md) return
    await md.write(filename, '# ' + name + '\n\n')
    setCreating(false)
    setNewName('')
    await loadFiles()
    openFile(filename, name)
  }

  const handleDelete = async (filename: string) => {
    const md = api()
    if (!md) return
    await md.delete(filename)
    if (activeFile === filename) {
      setActiveFile(null)
      setActiveName('')
      setContent('')
      setHtml('')
    }
    await loadFiles()
  }

  const hasApi = !!api()

  return (
    <div className="flex h-full -m-6">
      <div className="w-48 shrink-0 bg-secondary border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <button
            onClick={() => { setCreating(true); setNewName('') }}
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
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
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
                  ${activeFile === f.filename ? 'bg-card/80 text-accent font-semibold shadow-sm' : 'text-text-secondary hover:bg-card/50 hover:text-text-primary'}`}
              >
                <span className="truncate flex-1">📄 {f.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(f.filename) }}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger ml-1 shrink-0 transition-all duration-200 p-0.5"
                  title="删除"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="2" y1="2" x2="10" y2="10" />
                    <line x1="10" y1="2" x2="2" y2="10" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {!activeFile ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl block mb-3 opacity-30">📝</span>
              <span className="text-text-muted text-sm">
                {hasApi ? '选择或新建一个 Markdown 文档' : 'Markdown 编辑器需在 Electron 中运行'}
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
              <span className="text-[11px] text-text-muted">自动保存</span>
            </div>
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 border-r border-border overflow-hidden">
                <div className="h-full" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <CodeMirror
                    value={content}
                    onChange={handleChange}
                    extensions={[cmMarkdown(), cmTheme]}
                    basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: true }}
                    style={{ height: '100%' }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div
                  className="markdown-preview p-6 text-sm"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}