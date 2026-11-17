import { create } from "zustand";

interface UIState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  taskModalOpen: boolean;
  setTaskModalOpen: (v: boolean) => void;
  editTaskId?: string;
  setEditTaskId: (id?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  taskModalOpen: false,
  setTaskModalOpen: (v) => set({ taskModalOpen: v }),
  editTaskId: undefined,
  setEditTaskId: (id) => set({ editTaskId: id }),
}));