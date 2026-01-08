import { create } from 'zustand';

export interface ArtifactState {
    id: string;
    type: 'keyword' | 'backlink' | 'toast' | 'serp';
    title: string;
    status: 'loading' | 'streaming' | 'complete' | 'error';
    data: any;
    metadata?: Record<string, any>;
}

interface ArtifactStore {
    artifacts: Record<string, ArtifactState>;
    updateArtifact: (id: string, update: Partial<ArtifactState>) => void;
    clearArtifacts: () => void;
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
    artifacts: {},
    updateArtifact: (id, update) => set((state) => ({
        artifacts: {
            ...state.artifacts,
            [id]: {
                ...(state.artifacts[id] || { id, status: 'loading', data: null }),
                ...update,
            } as ArtifactState,
        },
    })),
    clearArtifacts: () => set({ artifacts: {} }),
}));
