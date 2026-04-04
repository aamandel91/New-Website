'use client'

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

const SITE_TOKEN_KEY = 'site_token'
const SITE_USER_KEY = 'site_user'
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface SiteUser {
  id: number
  email: string
  name: string | null
  phone: string | null
  favorites: SiteFavorite[]
  search_history: SearchHistoryEntry[]
}

export interface SiteFavorite {
  mlsNumber: string
  address?: string
  price?: number
  boardId?: number
  savedAt: string
}

export interface SearchHistoryEntry {
  filters: Record<string, any>
  label?: string
  timestamp: string
}

export interface SavedSearch {
  id: number
  user_id: number
  name: string
  filters: Record<string, any>
  alert_frequency: string
  new_count: number
  created_at: string
  updated_at: string
}

type SiteUserContextType = {
  isLoggedIn: boolean
  loading: boolean
  user: SiteUser | null
  savedSearches: SavedSearch[]
  register: (email: string, password: string, name?: string, phone?: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: { name?: string; email?: string; phone?: string; password?: string }) => Promise<boolean>
  deleteAccount: () => Promise<boolean>
  // Favorites
  addFavorite: (fav: Omit<SiteFavorite, 'savedAt'>) => Promise<void>
  removeFavorite: (mlsNumber: string) => Promise<void>
  isFavorite: (mlsNumber: string) => boolean
  // Saved searches
  createSavedSearch: (name: string, filters: Record<string, any>, alertFrequency?: string) => Promise<void>
  updateSavedSearch: (id: number, data: { name?: string; filters?: Record<string, any>; alertFrequency?: string }) => Promise<void>
  deleteSavedSearch: (id: number) => Promise<void>
  refreshSavedSearches: () => Promise<void>
  // Search history
  addSearchHistory: (filters: Record<string, any>, label?: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const SiteUserContext = createContext<SiteUserContextType | undefined>(undefined)

function getSiteToken(): string | null {
  if (typeof window === 'undefined') return null
  return cookies.get(SITE_TOKEN_KEY) || null
}

function setSiteToken(token: string) {
  cookies.set(SITE_TOKEN_KEY, token, { expires: 30, path: '/' })
}

function clearSiteToken() {
  cookies.remove(SITE_TOKEN_KEY)
}

function getStoredUser(): SiteUser | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const stored = localStorage.getItem(SITE_USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function storeUser(user: SiteUser | null) {
  if (typeof localStorage === 'undefined') return
  if (user) {
    localStorage.setItem(SITE_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SITE_USER_KEY)
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getSiteToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}/api/auth${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.userMessage || data.message || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token)
    if (!decoded.exp) return true
    return Math.floor(Date.now() / 1000) > decoded.exp
  } catch {
    return true
  }
}

const SiteUserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SiteUser | null>(getStoredUser)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(false)
  const token = getSiteToken()
  const isLoggedIn = Boolean(token && !isTokenExpired(token))

  const saveUser = useCallback((u: SiteUser | null) => {
    setUser(u)
    storeUser(u)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!getSiteToken()) return
    try {
      const data = await apiFetch<SiteUser>('/site-user/me')
      saveUser(data)
    } catch {
      // Token may be invalid
      clearSiteToken()
      saveUser(null)
    }
  }, [saveUser])

  const refreshSavedSearches = useCallback(async () => {
    if (!getSiteToken()) return
    try {
      const data = await apiFetch<{ searches: SavedSearch[] }>('/site-saved-searches')
      setSavedSearches(data.searches)
    } catch {
      // ignore
    }
  }, [])

  // Load profile on mount if token exists
  useEffect(() => {
    const t = getSiteToken()
    if (t && !isTokenExpired(t)) {
      refreshProfile()
      refreshSavedSearches()
    } else if (t) {
      // Token expired
      clearSiteToken()
      saveUser(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const register = useCallback(async (email: string, password: string, name?: string, phone?: string) => {
    setLoading(true)
    try {
      const data = await apiFetch<{ token: string; user: SiteUser }>('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, phone }),
      })
      setSiteToken(data.token)
      saveUser({ ...data.user, favorites: [], search_history: [] })
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }, [saveUser])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const data = await apiFetch<{ token: string; user: SiteUser }>('/site-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setSiteToken(data.token)
      saveUser({ ...data.user, favorites: data.user.favorites || [], search_history: data.user.search_history || [] })
      // Load saved searches after login
      setTimeout(() => refreshSavedSearches(), 100)
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }, [saveUser, refreshSavedSearches])

  const logout = useCallback(() => {
    clearSiteToken()
    saveUser(null)
    setSavedSearches([])
  }, [saveUser])

  const updateProfile = useCallback(async (data: { name?: string; email?: string; phone?: string; password?: string }) => {
    try {
      const updated = await apiFetch<SiteUser>('/site-user/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      saveUser({ ...user!, ...updated, favorites: user?.favorites || [], search_history: user?.search_history || [] })
      return true
    } catch {
      return false
    }
  }, [user, saveUser])

  const deleteAccount = useCallback(async () => {
    try {
      await apiFetch('/site-user/me', { method: 'DELETE' })
      clearSiteToken()
      saveUser(null)
      setSavedSearches([])
      return true
    } catch {
      return false
    }
  }, [saveUser])

  // Favorites
  const addFavorite = useCallback(async (fav: Omit<SiteFavorite, 'savedAt'>) => {
    try {
      const data = await apiFetch<{ favorites: SiteFavorite[] }>('/site-favorites', {
        method: 'POST',
        body: JSON.stringify(fav),
      })
      if (user) {
        saveUser({ ...user, favorites: data.favorites })
      }
    } catch {
      // ignore
    }
  }, [user, saveUser])

  const removeFavorite = useCallback(async (mlsNumber: string) => {
    try {
      const data = await apiFetch<{ favorites: SiteFavorite[] }>(`/site-favorites/${mlsNumber}`, {
        method: 'DELETE',
      })
      if (user) {
        saveUser({ ...user, favorites: data.favorites })
      }
    } catch {
      // ignore
    }
  }, [user, saveUser])

  const isFavorite = useCallback((mlsNumber: string) => {
    return (user?.favorites || []).some(f => f.mlsNumber === mlsNumber)
  }, [user])

  // Saved searches
  const createSavedSearch = useCallback(async (name: string, filters: Record<string, any>, alertFrequency?: string) => {
    try {
      await apiFetch('/site-saved-searches', {
        method: 'POST',
        body: JSON.stringify({ name, filters, alertFrequency }),
      })
      await refreshSavedSearches()
    } catch {
      // ignore
    }
  }, [refreshSavedSearches])

  const updateSavedSearch = useCallback(async (id: number, data: { name?: string; filters?: Record<string, any>; alertFrequency?: string }) => {
    try {
      await apiFetch(`/site-saved-searches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      await refreshSavedSearches()
    } catch {
      // ignore
    }
  }, [refreshSavedSearches])

  const deleteSavedSearch = useCallback(async (id: number) => {
    try {
      await apiFetch(`/site-saved-searches/${id}`, { method: 'DELETE' })
      await refreshSavedSearches()
    } catch {
      // ignore
    }
  }, [refreshSavedSearches])

  // Search history
  const addSearchHistory = useCallback(async (filters: Record<string, any>, label?: string) => {
    try {
      const data = await apiFetch<{ search_history: SearchHistoryEntry[] }>('/site-search-history', {
        method: 'POST',
        body: JSON.stringify({ filters, label }),
      })
      if (user) {
        saveUser({ ...user, search_history: data.search_history })
      }
    } catch {
      // ignore
    }
  }, [user, saveUser])

  const contextValue = useMemo(() => ({
    isLoggedIn,
    loading,
    user,
    savedSearches,
    register,
    login,
    logout,
    updateProfile,
    deleteAccount,
    addFavorite,
    removeFavorite,
    isFavorite,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    refreshSavedSearches,
    addSearchHistory,
    refreshProfile,
  }), [
    isLoggedIn, loading, user, savedSearches,
    register, login, logout, updateProfile, deleteAccount,
    addFavorite, removeFavorite, isFavorite,
    createSavedSearch, updateSavedSearch, deleteSavedSearch, refreshSavedSearches,
    addSearchHistory, refreshProfile,
  ])

  return (
    <SiteUserContext.Provider value={contextValue}>
      {children}
    </SiteUserContext.Provider>
  )
}

export default SiteUserProvider

export const useSiteUser = () => {
  const context = useContext(SiteUserContext)
  if (!context) {
    throw Error('useSiteUser must be used within a SiteUserProvider')
  }
  return context
}
