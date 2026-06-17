export interface ThemeVars {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-card": string;
  "--bg-hover": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--text-muted": string;
  "--accent": string;
  "--accent-hover": string;
  "--border": string;
  "--danger": string;
  "--success": string;
  "--shadow": string;
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  vars: ThemeVars;
}

export const themes: Theme[] = [
  {
    id: "mint",
    name: "薄荷绿",
    icon: "🌿",
    vars: {
      "--bg-primary": "#f2f7f2",
      "--bg-secondary": "#e8efe8",
      "--bg-card": "#ffffff",
      "--bg-hover": "#eaf2ea",
      "--text-primary": "#2d3a2d",
      "--text-secondary": "#5a6b5a",
      "--text-muted": "#8a9a8a",
      "--accent": "#5a8a6a",
      "--accent-hover": "#6fa87a",
      "--border": "#d8e4d8",
      "--danger": "#d46a6a",
      "--success": "#4a8a5a",
      "--shadow": "rgba(0,0,0,0.06)",
    },
  },
  {
    id: "dark",
    name: "暗夜紫",
    icon: "🌙",
    vars: {
      "--bg-primary": "#1e1e2e",
      "--bg-secondary": "#181825",
      "--bg-card": "#24243a",
      "--bg-hover": "#2a2a45",
      "--text-primary": "#cdd6f4",
      "--text-secondary": "#a6adc8",
      "--text-muted": "#6c7086",
      "--accent": "#89b4fa",
      "--accent-hover": "#74c7ec",
      "--border": "#313244",
      "--danger": "#f38ba8",
      "--success": "#a6e3a1",
      "--shadow": "rgba(0,0,0,0.3)",
    },
  },
  {
    id: "light",
    name: "暖白",
    icon: "☀️",
    vars: {
      "--bg-primary": "#f5f0eb",
      "--bg-secondary": "#ede8e3",
      "--bg-card": "#ffffff",
      "--bg-hover": "#f0ebe6",
      "--text-primary": "#3d3a4a",
      "--text-secondary": "#6b6578",
      "--text-muted": "#9d97ab",
      "--accent": "#7c6f9e",
      "--accent-hover": "#9b8ec4",
      "--border": "#e0dcd6",
      "--danger": "#e0556a",
      "--success": "#5a9e6f",
      "--shadow": "rgba(0,0,0,0.08)",
    },
  },
];

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0];
}
