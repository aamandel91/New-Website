'use client'

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { APIMessages, type ApiMessage } from 'services/API'
import { useUser } from 'providers/UserProvider'

type MessagesContextType = {
  messages: ApiMessage[]
  loading: boolean
  sending: boolean
  unreadCount: number
  send: (content: {
    message: string
    listings?: string[]
    links?: string[]
  }) => Promise<void>
  refresh: () => Promise<void>
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const { logged, userRole } = useUser()
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await APIMessages.fetchList()
      if (response?.messages && Array.isArray(response.messages)) {
        setMessages(response.messages)
      }
    } catch (error) {
      console.error('[MessagesProvider] fetch failed', error)
    } finally {
      setLoading(false)
    }
  }

  const send = async (content: {
    message: string
    listings?: string[]
    links?: string[]
  }) => {
    try {
      setSending(true)
      const newMsg = await APIMessages.send(content)
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg])
      }
    } catch (error) {
      console.error('[MessagesProvider] send failed', error)
    } finally {
      setSending(false)
    }
  }

  // Count unread messages from agent
  const unreadCount = useMemo(() => {
    return messages.filter((msg) => msg.sender === 'agent').length
  }, [messages])

  useEffect(() => {
    if (!logged || !userRole) return
    fetchMessages()
  }, [logged])

  const contextValue = useMemo(
    () => ({
      messages,
      loading,
      sending,
      unreadCount,
      send,
      refresh: fetchMessages
    }),
    [messages, loading, sending, unreadCount]
  )

  return (
    <MessagesContext.Provider value={contextValue}>
      {children}
    </MessagesContext.Provider>
  )
}

export default MessagesProvider

export const useMessages = () => {
  const context = useContext(MessagesContext)
  if (!context) {
    throw Error('useMessages must be used within a MessagesProvider')
  }
  return context
}
