'use client'

import { useMessages } from 'providers/MessagesProvider'
import { useUser } from 'providers/UserProvider'

import { ToolbarMenuItem, ToolbarMenuItemBadge } from '.'

const MessagesMenuItem = ({ url }: { url: string }) => {
  const { logged } = useUser()
  const { unreadCount } = useMessages()

  const count = logged ? unreadCount : 0

  return (
    <ToolbarMenuItemBadge count={count} flashing>
      <ToolbarMenuItem title="Messages" url={url} />
    </ToolbarMenuItemBadge>
  )
}

export default MessagesMenuItem
