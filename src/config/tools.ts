import type { ComponentType } from "react";
import HomePage from "../tools/HomePage";
import TodoList from "../tools/TodoList";
import Markdown from "../tools/Markdown";
import Memo from "../tools/Memo";
import TaskBoard from "../tools/TaskBoard";
import Clipboard from "../tools/Clipboard";

export interface Tool {
  key: string;
  name: string;
  icon: string;
  desc: string;
  component: ComponentType<{ onNavigate?: (key: string) => void }>;
  fileType?: "data" | "markdown";
}

export const allTools: Tool[] = [
  { key: "home", name: "主页", icon: "🏠", desc: "应用概览", component: HomePage },
  { key: "clipboard", name: "剪贴板", icon: "📋", desc: "剪贴板历史与收藏", component: Clipboard, fileType: "data" },
  { key: "memo", name: "备忘录", icon: "📒", desc: "记录碎片想法", component: Memo, fileType: "data" },
  { key: "todolist", name: "待办事项", icon: "📋", desc: "管理日常任务", component: TodoList, fileType: "data" },
  { key: "taskboard", name: "任务列表", icon: "📌", desc: "看板管理任务", component: TaskBoard, fileType: "data" },
  { key: "markdown", name: "Markdown", icon: "📝", desc: "编写MD文档", component: Markdown, fileType: "markdown" },
];

export const homePageTools = allTools.filter((t) => t.key !== "home");

export function getStorageTools() {
  return allTools.filter((t) => t.fileType != null);
}
