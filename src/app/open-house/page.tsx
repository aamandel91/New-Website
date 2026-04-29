'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import HomeIcon from '@mui/icons-material/Home'
import QrCodeIcon from '@mui/icons-material/QrCode2'
import CopyIcon from '@mui/icons-material/ContentCopy'
import PrintIcon from '@mui/icons-material/Print'

interface PropertyData {
  mlsNumber: string
  address: {
    streetNumber: string
    streetName: string
    streetSuffix: string
    streetDirection: string
    city: string
    state: string
    zip: string
    unitNumber?: string
  }
  listPrice: string
  images: string[]
}

export default function OpenHouseSetupPage() {
  const [mlsNumber, setMlsNumber] = useState('')
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [agentName, setAgentName] = useState('')
  const [agentEmail, setAgentEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [sessionResult, setSessionResult] = useState<{ sessionId: string; signInUrl: string } | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const formatAddress = (addr: PropertyData['address']) => {
    const parts = [
      addr.streetNumber,
      addr.streetDirection,
      addr.streetName,
      addr.streetSuffix
    ].filter(Boolean)
    const street = parts.join(' ')
    const unit = addr.unitNumber ? ` #${addr.unitNumber}` : ''
    return `${street}${unit}, ${addr.city}, ${addr.state} ${addr.zip}`
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (isNaN(num)) return price
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num)
  }

  const handleLookup = async () => {
    if (!mlsNumber.trim()) return

    setLookingUp(true)
    setLookupError(null)
    setProperty(null)

    try {
      const res = await fetch(`/api/open-house/lookup?mls=${encodeURIComponent(mlsNumber.trim())}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Property not found')
      }
      const data = await res.json()
      setProperty(data.property)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Failed to look up property')
    } finally {
      setLookingUp(false)
    }
  }

  const handleCreate = async () => {
    if (!property || !agentName) return

    setCreating(true)

    try {
      const address = formatAddress(property.address)
      const res = await fetch('/api/open-house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlsNumber: property.mlsNumber,
          agentName,
          agentEmail,
          propertyAddress: address,
          propertyImage: property.images?.[0] || '',
          propertyPrice: property.listPrice || ''
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create session')
      }

      const data = await res.json()
      setSessionResult(data)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Failed to create open house')
    } finally {
      setCreating(false)
    }
  }

  const getFullSignInUrl = () => {
    if (!sessionResult) return ''
    return `${window.location.origin}${sessionResult.signInUrl}`
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getFullSignInUrl())
      setCopySuccess(true)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = getFullSignInUrl()
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopySuccess(true)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const url = getFullSignInUrl()
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Open House QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
            h1 { font-size: 28px; margin-bottom: 8px; }
            p { font-size: 18px; color: #555; margin-bottom: 24px; }
            img { margin: 20px auto; display: block; }
            .url { font-size: 14px; color: #888; word-break: break-all; margin-top: 24px; }
          </style>
        </head>
        <body>
          <h1>Welcome to Our Open House!</h1>
          <p>${property ? formatAddress(property.address) : ''}</p>
          <p>Scan to sign in:</p>
          <img src="${qrUrl}" width="400" height="400" alt="QR Code" />
          <p class="url">${url}</p>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // If session created, show result
  if (sessionResult) {
    const fullUrl = getFullSignInUrl()
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`

    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Open House Created!</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Share this link or QR code with visitors
          </Typography>

          {property && (
            <Paper sx={{ p: 3, mb: 4, textAlign: 'left' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                {property.images?.[0] && (
                  <Box
                    component="img"
                    src={property.images[0]}
                    alt="Property"
                    sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1 }}
                  />
                )}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {formatAddress(property.address)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatPrice(property.listPrice)} &bull; MLS# {property.mlsNumber}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          <Paper sx={{ p: 4, mb: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR Code"
              width={300}
              height={300}
              style={{ margin: '0 auto', display: 'block' }}
            />
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}
            >
              {fullUrl}
            </Typography>
          </Paper>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<CopyIcon />}
              onClick={handleCopyLink}
            >
              Copy Link
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print QR Code
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSessionResult(null)
                setProperty(null)
                setMlsNumber('')
                setAgentName('')
                setAgentEmail('')
              }}
            >
              Create Another
            </Button>
          </Stack>

          <Snackbar
            open={copySuccess}
            autoHideDuration={2000}
            onClose={() => setCopySuccess(false)}
            message="Link copied to clipboard"
          />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <HomeIcon color="primary" fontSize="large" />
          <Typography variant="h3">Open House Setup</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Create a sign-in page for your open house visitors
        </Typography>

        {lookupError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLookupError(null)}>
            {lookupError}
          </Alert>
        )}

        {/* Step 1: Look up property */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>1. Find Your Property</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="MLS Number"
              value={mlsNumber}
              onChange={(e) => setMlsNumber(e.target.value)}
              placeholder="Enter MLS #"
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              disabled={lookingUp}
            />
            <Button
              variant="contained"
              onClick={handleLookup}
              disabled={!mlsNumber.trim() || lookingUp}
              startIcon={lookingUp ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ minWidth: 140 }}
            >
              {lookingUp ? 'Looking...' : 'Look Up'}
            </Button>
          </Stack>
        </Paper>

        {/* Property confirmation */}
        {property && (
          <>
            <Paper sx={{ p: 3, mb: 3, border: '2px solid', borderColor: 'success.main' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                Property Found
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {property.images?.[0] && (
                  <Box
                    component="img"
                    src={property.images[0]}
                    alt="Property"
                    sx={{
                      width: 120,
                      height: 90,
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                  />
                )}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {formatAddress(property.address)}
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight={700}>
                    {formatPrice(property.listPrice)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    MLS# {property.mlsNumber}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Step 2: Agent info */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>2. Agent Information</Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Agent Name</InputLabel>
                  <Select
                    value={agentName}
                    label="Agent Name"
                    onChange={(e: SelectChangeEvent) => setAgentName(e.target.value)}
                  >
                    <MenuItem value="Site Owner">Site Owner</MenuItem>
                    <MenuItem value="Agent 1">Agent 1</MenuItem>
                    <MenuItem value="Agent 2">Agent 2</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Agent Email (optional)"
                  type="email"
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  placeholder="agent@example.com"
                />
              </Stack>
            </Paper>

            {/* Step 3: Create */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleCreate}
              disabled={!agentName || creating}
              startIcon={creating ? <CircularProgress size={20} /> : <QrCodeIcon />}
              sx={{ py: 1.5, fontSize: '1.1rem' }}
            >
              {creating ? 'Creating...' : 'Create Open House'}
            </Button>
          </>
        )}
      </Box>
    </Container>
  )
}
