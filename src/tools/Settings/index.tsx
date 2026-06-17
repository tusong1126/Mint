import { useState, useEffect, Fragment } from "react";
import ThemeSwitcher from "../../themes/ThemeSwitcher";
import Tooltip from "../../components/Tooltip";
import { getStorageTools } from "../../config/tools";

function getApi() {
  return (window as any).electronAPI;
}

function getPlatform() {
  return getApi()?.platform || "darwin";
}

function getFallbackDir(fileType: "data" | "markdown") {
  const platform = getPlatform();
  if (fileType === "markdown") {
    return platform === "win32" ? "%APPDATA%\\Mint\\markdown" : "~/Library/Application Support/Mint/markdown";
  }
  return platform === "win32" ? "%APPDATA%\\Mint\\data" : "~/Library/Application Support/Mint/data";
}

function getOpenCommand(path: string) {
  return `open ${path.replace(/ /g, "\\ ")}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-14 text-[11px] py-1 px-2 rounded-md bg-hover text-text-secondary hover:text-accent hover:bg-hover/80 transition-all duration-200 shrink-0 font-medium"
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function PathRow({ label, path }: { label: string; path: string }) {
  const [cmdCopied, setCmdCopied] = useState(false);
  const openCmd = getOpenCommand(path);

  const handleCopyCmd = async () => {
    try {
      await navigator.clipboard.writeText(openCmd);
      setCmdCopied(true);
      setTimeout(() => setCmdCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-text-primary shrink-0 mr-3 font-medium">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-xs text-text-muted truncate max-w-[280px] bg-primary px-2.5 py-1 rounded-md border border-border/50">
          {path}
        </code>
        <CopyButton text={path} />
        <Tooltip text="复制该指令后，打开你的mac终端应用程序，粘贴后回车执行，即可查看你的文件存放位置">
          <button
            onClick={handleCopyCmd}
            className="w-16 text-[11px] py-1 px-2 rounded-md bg-hover text-text-secondary hover:text-accent hover:bg-hover/80 transition-all duration-200 shrink-0 font-medium"
          >
            {cmdCopied ? "已复制" : "终端指令"}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-primary">{label}</span>
      <span className="text-sm text-text-secondary">{value}</span>
    </div>
  );
}

export default function Settings() {
  const api = getApi();
  const platform = getPlatform();
  const arch = api?.arch || "unknown";
  const systemVersion = api?.systemVersion || "";
  const versions = api?.versions;
  const [cpuModel, setCpuModel] = useState("");
  const [dirs, setDirs] = useState<{ data: string; markdown: string } | null>(null);

  useEffect(() => {
    api?.system?.getCpu().then(setCpuModel);
    api?.storage?.dirs?.().then(setDirs);
  }, []);

  function getDir(fileType: "data" | "markdown"): string {
    if (dirs) return dirs[fileType];
    return getFallbackDir(fileType);
  }

  const osMap: Record<string, string> = {
    darwin: "macOS",
    win32: "Windows",
    linux: "Linux",
  };
  const osName = osMap[platform] || platform;
  const archLabel = cpuModel || (arch === "arm64" ? "Apple Silicon" : arch === "x64" ? "Intel x64" : arch);
  const osFull = systemVersion ? `${osName} ${systemVersion}` : osName;

  const storageEntries = getStorageTools();

  return (
    <div className="max-w-[560px] mx-auto">
      <section className="mb-8">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">外观</h3>
        <div className="bg-card rounded-xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-text-primary">主题色</span>
              <p className="text-xs text-text-muted mt-0.5">选择你喜欢的配色方案</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">本地存储</h3>
        <div className="bg-card rounded-xl p-5 border border-border/50">
          {storageEntries.map((entry, i) => (
            <Fragment key={entry.key}>
              <PathRow label={entry.name} path={getDir(entry.fileType!)} />
              {i < storageEntries.length - 1 && <div className="border-t border-border/50 my-1" />}
            </Fragment>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">系统信息</h3>
        <div className="bg-card rounded-xl p-5 border border-border/50">
          <InfoRow label="操作系统" value={`${osFull} · ${archLabel}`} />
          <div className="border-t border-border/50 my-1" />
          {versions ? (
            <>
              <InfoRow label="Electron" value={`v${versions.electron}`} />
              <InfoRow label="Chromium" value={`v${versions.chrome}`} />
              <InfoRow label="Node.js" value={`v${versions.node}`} />
            </>
          ) : (
            <InfoRow label="运行环境" value="浏览器 (非 Electron)" />
          )}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">关于</h3>
        <div className="bg-card rounded-xl p-5 border border-border/50">
          <InfoRow label="版本" value="v1.0.0" />
        </div>
      </section>
    </div>
  );
}