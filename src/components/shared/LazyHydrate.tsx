'use client'

import React, {
  type ReactNode,
  startTransition,
  useEffect,
  useRef,
  useState
} from 'react'

/**
 * Defers hydration of server-rendered below-the-fold content until it nears
 * the viewport.
 *
 * The server renders children normally, so the HTML/SEO output is unchanged
 * and links inside it work natively before hydration. On the client the
 * wrapper renders a dangerouslySetInnerHTML shell instead, which makes React
 * leave the server-rendered DOM untouched during hydration (the documented
 * innerHTML bailout). When the block scrolls within `rootMargin`, the real
 * component tree mounts inside a transition (so the static HTML stays visible
 * while its chunks load) and takes over.
 *
 * Use only for sections with no above-the-fold interactivity.
 */
const LazyHydrate = ({
  children,
  rootMargin = '700px'
}: {
  children: ReactNode
  rootMargin?: string
}) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hydrated) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      startTransition(() => setHydrated(true))
      return undefined
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          startTransition(() => setHydrated(true))
        }
      },
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hydrated, rootMargin])

  if (typeof window === 'undefined' || hydrated) {
    return <div ref={ref}>{children}</div>
  }

  return (
    <div
      ref={ref}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: '' }}
    />
  )
}

export default LazyHydrate
