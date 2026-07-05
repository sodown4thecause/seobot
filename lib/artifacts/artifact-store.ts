import { create } from 'zustand'
import type { ArtifactState } from '@/lib/artifacts/types'

interface ArtifactStore {
  artifacts: Record<string, ArtifactState>
  updateArtifact: (id: string, update: Partial<ArtifactState>) => void
  clearArtifacts: () => void
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
  artifacts: {},
  updateArtifact: (id, update) =>
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        [id]: {
          ...(state.artifacts[id] ?? {
            id,
            type: 'keyword',
            title: 'Artifact',
            status: 'loading',
            data: null,
          }),
          ...update,
          id,
        } as ArtifactState,
      },
    })),
  clearArtifacts: () => set({ artifacts: {} }),
}))

export type { ArtifactState } from '@/lib/artifacts/types'
