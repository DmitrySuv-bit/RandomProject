import { create } from 'zustand'

export type TabId = 'participants' | 'settings' | 'results'

interface UiState {
  /** Активная вкладка */
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'participants',
  setActiveTab: (activeTab) => set({ activeTab }),
}))
