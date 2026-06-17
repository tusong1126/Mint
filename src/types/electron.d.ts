export {}

interface MarkdownFile {
  name: string
  filename: string
  mtime: number
}

declare global {
  interface Window {
    electronAPI?: {
      platform: string
      arch: string
      systemVersion: string
      versions: {
        electron: string
        chrome: string
        node: string
      }
      storage: {
        read: (filename: string) => Promise<any>
        write: (filename: string, data: any) => Promise<boolean>
      }
      markdown: {
        list: () => Promise<MarkdownFile[]>
        read: (filename: string) => Promise<string>
        write: (filename: string, content: string) => Promise<boolean>
        delete: (filename: string) => Promise<boolean>
      }
      system: {
        getCpu: () => Promise<string>
      }
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
        onMaximized: (callback: (maximized: boolean) => void) => void
      }
    }
  }
}