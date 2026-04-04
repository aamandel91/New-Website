'use client'

import { useEffect, useRef, useState } from 'react'

import {
  Avatar,
  Box,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  TextField,
  Typography
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'

import type { ApiMessage } from 'services/API'
import { useMessages } from 'providers/MessagesProvider'
import { useUser } from 'providers/UserProvider'

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return ''
  }
}

const getDateKey = (msg: ApiMessage) => {
  const dt = msg.delivery?.sentDateTime || ''
  try {
    return new Date(dt).toDateString()
  } catch {
    return ''
  }
}

const MessageBubble = ({
  message,
  isClient
}: {
  message: ApiMessage
  isClient: boolean
}) => {
  const sentTime = message.delivery?.sentDateTime
    ? formatTime(message.delivery.sentDateTime)
    : ''
  const isPending = message.delivery?.status === 'pending'

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isClient ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 1,
        mb: 1.5
      }}
    >
      {!isClient && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontSize: 14
          }}
        >
          A
        </Avatar>
      )}
      <Box sx={{ maxWidth: '70%' }}>
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: isClient ? 'primary.main' : 'grey.100',
            color: isClient ? 'primary.contrastText' : 'text.primary',
            borderBottomRightRadius: isClient ? 4 : 16,
            borderBottomLeftRadius: isClient ? 16 : 4
          }}
        >
          {message.content?.message && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content.message}
            </Typography>
          )}
          {message.content?.listings &&
            message.content.listings.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {message.content.listings.map((mls) => (
                  <Typography
                    key={mls}
                    variant="caption"
                    sx={{
                      display: 'block',
                      opacity: 0.85,
                      textDecoration: 'underline'
                    }}
                  >
                    Listing: {mls}
                  </Typography>
                ))}
              </Box>
            )}
          {message.content?.links && message.content.links.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {message.content.links.map((link, i) => (
                <Typography
                  key={i}
                  variant="caption"
                  component="a"
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'block',
                    color: isClient ? 'primary.contrastText' : 'primary.main',
                    textDecoration: 'underline'
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isClient ? 'flex-end' : 'flex-start',
            mt: 0.5,
            px: 0.5,
            gap: 0.5
          }}
        >
          {sentTime && (
            <Typography variant="caption" color="text.secondary">
              {sentTime}
            </Typography>
          )}
          {isPending && (
            <Typography
              variant="caption"
              color="text.secondary"
              fontStyle="italic"
            >
              Sending...
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

const DateDivider = ({ date }: { date: string }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      my: 2,
      gap: 2
    }}
  >
    <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
    <Typography variant="caption" color="text.secondary" fontWeight={500}>
      {date}
    </Typography>
    <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
  </Box>
)

const LoadingSkeleton = () => (
  <Box sx={{ px: 2, py: 3 }}>
    {[...Array(4)].map((_, i) => {
      const isRight = i % 2 === 1
      return (
        <Box
          key={i}
          sx={{
            display: 'flex',
            justifyContent: isRight ? 'flex-end' : 'flex-start',
            mb: 2
          }}
        >
          <Skeleton
            variant="rounded"
            width={`${40 + Math.random() * 25}%`}
            height={48 + Math.random() * 24}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      )
    })}
  </Box>
)

const EmptyState = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: 2
    }}
  >
    <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
    <Typography variant="h6" color="text.secondary">
      No messages yet
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      textAlign="center"
      maxWidth={360}
    >
      Send a message to your agent to get started. They can help with property
      questions, scheduling showings, and more.
    </Typography>
  </Box>
)

const MessagesPageContent = () => {
  const { messages, loading, sending, send } = useMessages()
  const { profile } = useUser()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setDraft('')
    await send({ message: text })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  let lastDateKey = ''

  return (
    <Container maxWidth="md">
      <Typography variant="h5" fontWeight={600} mb={3}>
        Messages
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 'calc(100vh - 300px)', md: '600px' },
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
        {/* Chat area */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, md: 3 },
            py: 2
          }}
        >
          {loading ? (
            <LoadingSkeleton />
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((msg) => {
              const dateKey = getDateKey(msg)
              const showDate = dateKey !== lastDateKey
              lastDateKey = dateKey

              const isClient = msg.sender === 'client'

              return (
                <Box key={msg.messageId}>
                  {showDate && (
                    <DateDivider
                      date={formatDate(msg.delivery?.sentDateTime || '')}
                    />
                  )}
                  <MessageBubble message={msg} isClient={isClient} />
                </Box>
              )
            })
          )}
        </Box>

        {/* Input area */}
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            px: { xs: 2, md: 3 },
            py: 1.5,
            bgcolor: 'background.paper'
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            variant="outlined"
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSend}
                      disabled={!draft.trim() || sending}
                      color="primary"
                      size="small"
                    >
                      {sending ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default MessagesPageContent
