export {}

interface MarkdownFile {
  name: string
  filename: string
  mtime: number
}

interface ClipboardChangeData {
  type: "text" | "image" | "file"
  content?: string
  filePath?: string
  id?: string
  imagePath?: string
  thumbnail?: string
  width?: number
  height?: number
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
        dirs: () => Promise<{ data: string; markdown: string }>
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
      clipboard: {
        write: (text: string) => Promise<void>
        copyImage: (imagePath: string) => Promise<boolean>
        readImageFull: (imagePath: string) => Promise<string | null>
        deleteImage: (imagePath: string) => Promise<boolean>
        openFileLocation: (filePath: string) => Promise<boolean>
        paste: () => Promise<void>
        startWatch: () => Promise<void>
        stopWatch: () => Promise<void>
        onChanged: (callback: (data: ClipboardChangeData) => void) => void
        removeChanged: () => void
      }
    }
  }
}