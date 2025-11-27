'use client'

import { useEffect, useState } from 'react'
import { isAgentSubdomain } from '@/utils/agentSubdomain'

/**
 * AgentSubdomainSEO Component
 *
 * Automatically adds noindex, nofollow meta tags when the page is viewed
 * on an agent subdomain (e.g., john-smith.yoursite.com) to prevent search
 * engines from indexing agent-specific pages.
 *
 * Usage: Add this component to your layout or page component.
 * <AgentSubdomainSEO />
 */
export default function AgentSubdomainSEO() {
  const [isAgent, setIsAgent] = useState(false)

  useEffect(() => {
    // Check if we're on an agent subdomain
    const agentSubdomain = isAgentSubdomain()
    setIsAgent(agentSubdomain)

    if (agentSubdomain) {
      // Add meta tags to prevent indexing
      const existingRobotsTag = document.querySelector('meta[name="robots"]')

      if (existingRobotsTag) {
        // Update existing robots tag
        existingRobotsTag.setAttribute('content', 'noindex, nofollow')
      } else {
        // Create new robots meta tag
        const robotsTag = document.createElement('meta')
        robotsTag.name = 'robots'
        robotsTag.content = 'noindex, nofollow'
        document.head.appendChild(robotsTag)
      }

      // Also add googlebot-specific tag for redundancy
      const existingGooglebotTag = document.querySelector('meta[name="googlebot"]')

      if (!existingGooglebotTag) {
        const googlebotTag = document.createElement('meta')
        googlebotTag.name = 'googlebot'
        googlebotTag.content = 'noindex, nofollow'
        document.head.appendChild(googlebotTag)
      }
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
