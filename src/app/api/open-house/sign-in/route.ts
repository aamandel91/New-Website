import { NextResponse } from 'next/server'

interface OpenHouseSignInRequest {
  firstName: string
  lastName: string
  email: string
  phone: string
  buyingTimeline: string
  hasAgent: boolean
  agentName: string
  wantsMarketUpdates: boolean
  wantsPropertyUpdates: boolean
  propertyMls: string
  propertyAddress: string
  recaptchaToken?: string
  timestamp: string
}

// Verify reCAPTCHA token with Google
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.warn('reCAPTCHA secret key not configured, skipping verification')
    return true // Allow in development
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()

    // For reCAPTCHA v3, check score (0.0 - 1.0, higher is better)
    if (data.success && data.score !== undefined) {
      return data.score >= 0.5 // Adjust threshold as needed
    }

    return data.success
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return false
  }
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone format (basic)
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/
  return phone.length >= 10 && phoneRegex.test(phone)
}

export async function POST(request: Request) {
  try {
    const body: OpenHouseSignInRequest = await request.json()

    // Validate required fields
    if (!body.firstName?.trim()) {
      return NextResponse.json({ message: 'First name is required' }, { status: 400 })
    }

    if (!body.lastName?.trim()) {
      return NextResponse.json({ message: 'Last name is required' }, { status: 400 })
    }

    if (!body.email?.trim()) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    if (!isValidEmail(body.email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    if (!body.phone?.trim()) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 })
    }

    if (!isValidPhone(body.phone)) {
      return NextResponse.json({ message: 'Invalid phone format' }, { status: 400 })
    }

    if (!body.buyingTimeline) {
      return NextResponse.json({ message: 'Buying timeline is required' }, { status: 400 })
    }

    if (body.hasAgent && !body.agentName?.trim()) {
      return NextResponse.json({ message: 'Agent name is required when working with an agent' }, { status: 400 })
    }

    // Verify reCAPTCHA if token provided
    if (body.recaptchaToken) {
      const isValid = await verifyRecaptcha(body.recaptchaToken)
      if (!isValid) {
        return NextResponse.json(
          { message: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // Prepare the sign-in data
    const signInData = {
      name: `${body.firstName} ${body.lastName}`,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      buyingTimeline: body.buyingTimeline,
      hasAgent: body.hasAgent,
      agentName: body.agentName || null,
      wantsMarketUpdates: body.wantsMarketUpdates,
      wantsPropertyUpdates: body.wantsPropertyUpdates,
      propertyMls: body.propertyMls,
      propertyAddress: body.propertyAddress,
      timestamp: body.timestamp,
      source: 'open_house_signin',
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }

    // NOTE: Open-house sign-in workflow is scaffolding only — feature is not
    // yet prioritized. When wired up, integration points are: Repliers API
    // lead capture, eventsCollection record, agent email notification, and
    // CRM (Follow Up Boss) push. Tracked in docs/cleanup/deferred-items.md.
    console.log('Open House Sign-In:', JSON.stringify(signInData, null, 2))

    // Example: Send to backend API (uncomment and configure when ready)
    /*
    try {
      const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/open-house/sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
        },
        body: JSON.stringify(signInData),
      })

      if (!backendResponse.ok) {
        throw new Error('Failed to send to backend')
      }
    } catch (error) {
      console.error('Backend integration error:', error)
      // Continue even if backend fails, to not block user
    }
    */

    // Example: Send email notification to agent (uncomment when SMTP is configured)
    /*
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/notify-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'open_house_signin',
          data: signInData,
        }),
      })
    } catch (error) {
      console.error('Email notification error:', error)
    }
    */

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for signing in! We will be in touch shortly.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Open house sign-in error:', error)
    return NextResponse.json(
      {
        message: 'An error occurred while processing your sign-in. Please try again.',
      },
      { status: 500 }
    )
  }
}
