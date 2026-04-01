import Script from 'next/script'

const SURESEND_PIXEL_ID = process.env.NEXT_PUBLIC_SURESEND_PIXEL_ID

const SureSendPixel = () => {
  if (!SURESEND_PIXEL_ID) return null

  return (
    <Script
      id="suresend-pixel"
      strategy="afterInteractive"
      src={`https://pixel.suresend.ai/pixel/${SURESEND_PIXEL_ID}.js`}
    />
  )
}

export default SureSendPixel
