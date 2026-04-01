import Script from 'next/script'

const SURESEND_PIXEL_ID = process.env.NEXT_PUBLIC_SURESEND_PIXEL_ID || ''

const SureSendPixel = () => {
  if (!SURESEND_PIXEL_ID) return null

  return (
    <Script
      id="suresend-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function(w,t,c){w['SureSendPixel']=c;(w[c]=w[c]||function(){
(w[c].q=w[c].q||[]).push(arguments);}),(w[c].t=1*new Date());
var s=document.createElement('script');
s.async=1;s.src=t;
document.head.appendChild(s);
})(window,"https://suresend.ai/pixel/${SURESEND_PIXEL_ID}.js","ssPixel");
window.ssPixel("init", "${SURESEND_PIXEL_ID}");
window.ssPixel("track", "pageview");
        `.trim(),
      }}
    />
  )
}

export default SureSendPixel
