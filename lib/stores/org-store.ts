import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OrgState {
    currentOrgId: string | null
    currentOrgName: string | null
    setOrg: (id: string, name: string) => void
    clearOrg: () => void
}

export const useOrgStore = create<OrgState>()(
    persist(
        (set) => ({
            currentOrgId: null,
            currentOrgName: null,
            setOrg: (id, name) => set({ currentOrgId: id, currentOrgName: name }),
            clearOrg: () => set({ currentOrgId: null, currentOrgName: null }),
        }),
        { name: 'org' }
    )
)
