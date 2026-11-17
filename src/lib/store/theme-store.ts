import { create } from "zustand";
import type { ThemeMode } from "../types";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  apply: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: (localStorage.getItem("taskflow_theme") as ThemeMode) || "system",
  setMode: (mode) => {
    localStorage.setItem("taskflow_theme", mode);
    set({ mode });
    get().apply();
  },
  apply: () => {
    const { mode } = get();
    const isDark =
      mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  },
}));