import React from 'react'

interface HiddenPropertyDescriptionProps {
  description: string
  enabled: boolean
}

const HiddenPropertyDescription: React.FC<HiddenPropertyDescriptionProps> = ({
  description,
  enabled
}) => {
  if (!enabled || !description) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}
    >
      {description}
    </div>
  )
}

export default HiddenPropertyDescription
