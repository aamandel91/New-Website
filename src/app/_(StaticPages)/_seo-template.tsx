/**
 * STATIC PAGES - SEO IMPLEMENTATION TEMPLATE
 *
 * Apply this pattern to static pages like:
 * - /src/app/(StaticPages)/privacy-policy/page.tsx
 * - /src/app/(StaticPages)/terms-of-use/page.tsx
 * - /src/app/(StaticPages)/cookies-policy/page.tsx
 * - /src/app/(StaticPages)/accessibility/page.tsx
 * - /src/app/(StaticPages)/dmca-notice/page.tsx
 *
 * This template shows how to:
 * - Set metadata for static pages
 * - Create breadcrumbs
 * - Use canonical URLs
 * - Add FAQ schema for FAQ pages
 */

import type { Metadata } from 'next'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema, faqSchema } from 'utils/structuredData'

/**
 * Example metadata for privacy policy page
 * Customize these values for each static page
 */
export const metadata: Metadata = {
  title: 'Privacy Policy | Florida Home Finder',
  description: 'Learn how Florida Home Finder collects, uses, and protects your personal information.',
  keywords: ['privacy', 'data protection', 'personal information', 'GDPR'],
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: 'https://floridahomefinder.com/privacy-policy'
  },
  openGraph: {
    type: 'website',
    title: 'Privacy Policy | Florida Home Finder',
    description: 'Learn how Florida Home Finder collects, uses, and protects your personal information.',
    url: 'https://floridahomefinder.com/privacy-policy',
    siteName: 'Florida Home Finder'
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | Florida Home Finder',
    description: 'Learn how Florida Home Finder protects your data'
  }
}

/**
 * Example static page component with structured data
 */
export default function PrivacyPolicyPage() {
  // Generate breadcrumb schema
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: 'https://floridahomefinder.com' },
    { name: 'Privacy Policy', url: 'https://floridahomefinder.com/privacy-policy' }
  ])

  // Example FAQ schema if page has FAQs
  const faqs = faqSchema([
    {
      question: 'What personal information do you collect?',
      answer: 'We collect information you provide directly to us, such as name, email, phone number, and property preferences. We also collect information automatically through cookies and analytics.'
    },
    {
      question: 'How do you use my information?',
      answer: 'We use your information to provide and improve our services, respond to your inquiries, send marketing communications, and comply with legal obligations.'
    },
    {
      question: 'How long do you keep my data?',
      answer: 'We keep your personal information for as long as necessary to provide our services or comply with legal obligations. You can request deletion at any time.'
    }
  ])

  return (
    <>
      {/* Inject structured data */}
      <StructuredData data={breadcrumbs} />
      <StructuredData data={faqs} />

      {/* Your privacy policy content */}
      <div className="static-page privacy-policy">
        <h1>Privacy Policy</h1>

        <section>
          <h2>1. Information We Collect</h2>
          <p>
            Florida Home Finder collects various types of information in connection with the services we provide. This
            includes personal information you provide directly and information collected automatically through your
            interactions with our website.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, respond to your requests,
            and communicate with you about updates and offers.
          </p>
        </section>

        <section>
          <h2>3. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2>4. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal information. You can exercise these rights by
            contacting us at privacy@floridahomefinder.com.
          </p>
        </section>

        <section>
          <h2>Frequently Asked Questions</h2>
          <div className="faq">
            <details>
              <summary>What personal information do you collect?</summary>
              <p>
                We collect information you provide directly to us, such as name, email, phone number, and property
                preferences. We also collect information automatically through cookies and analytics.
              </p>
            </details>

            <details>
              <summary>How do you use my information?</summary>
              <p>
                We use your information to provide and improve our services, respond to your inquiries, send marketing
                communications, and comply with legal obligations.
              </p>
            </details>

            <details>
              <summary>How long do you keep my data?</summary>
              <p>
                We keep your personal information for as long as necessary to provide our services or comply with legal
                obligations. You can request deletion at any time.
              </p>
            </details>
          </div>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please contact us at:{' '}
            <a href="mailto:privacy@floridahomefinder.com">privacy@floridahomefinder.com</a>
          </p>
        </section>
      </div>
    </>
  )
}

/**
 * METADATA TEMPLATES FOR OTHER STATIC PAGES
 */

/**
 * Terms of Use Page Metadata
 */
export const termsMetadata: Metadata = {
  title: 'Terms of Use | Florida Home Finder',
  description: 'Read the terms and conditions for using Florida Home Finder website and services.',
  keywords: ['terms', 'conditions', 'terms of use', 'legal'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://floridahomefinder.com/terms-of-use'
  },
  openGraph: {
    type: 'website',
    title: 'Terms of Use | Florida Home Finder',
    description: 'Read the terms and conditions for using Florida Home Finder.',
    url: 'https://floridahomefinder.com/terms-of-use',
    siteName: 'Florida Home Finder'
  }
}

/**
 * Cookies Policy Page Metadata
 */
export const cookiesMetadata: Metadata = {
  title: 'Cookie Policy | Florida Home Finder',
  description: 'Learn about how Florida Home Finder uses cookies and similar technologies.',
  keywords: ['cookies', 'tracking', 'privacy', 'analytics'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://floridahomefinder.com/cookies-policy'
  },
  openGraph: {
    type: 'website',
    title: 'Cookie Policy | Florida Home Finder',
    description: 'Learn how we use cookies to enhance your experience.',
    url: 'https://floridahomefinder.com/cookies-policy',
    siteName: 'Florida Home Finder'
  }
}

/**
 * Accessibility Statement Metadata
 */
export const accessibilityMetadata: Metadata = {
  title: 'Accessibility Statement | Florida Home Finder',
  description: 'Florida Home Finder is committed to ensuring digital accessibility for people with disabilities.',
  keywords: ['accessibility', 'WCAG', 'ADA', 'inclusive'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://floridahomefinder.com/accessibility'
  },
  openGraph: {
    type: 'website',
    title: 'Accessibility Statement | Florida Home Finder',
    description: 'Our commitment to accessibility and inclusive design.',
    url: 'https://floridahomefinder.com/accessibility',
    siteName: 'Florida Home Finder'
  }
}

/**
 * DMCA Notice Metadata
 */
export const dmcaMetadata: Metadata = {
  title: 'DMCA Notice | Florida Home Finder',
  description: 'Digital Millennium Copyright Act (DMCA) notice and copyright information.',
  keywords: ['DMCA', 'copyright', 'intellectual property'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://floridahomefinder.com/dmca-notice'
  },
  openGraph: {
    type: 'website',
    title: 'DMCA Notice | Florida Home Finder',
    description: 'DMCA notice and copyright information.',
    url: 'https://floridahomefinder.com/dmca-notice',
    siteName: 'Florida Home Finder'
  }
}
