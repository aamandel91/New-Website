'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { useSiteUser } from 'providers/SiteUserProvider'
import { ssIdentify } from 'utils/suresendTracking'

interface LoginDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultTab?: 0 | 1
}

const LoginDialog = ({ open, onClose, onSuccess, defaultTab = 0 }: LoginDialogProps) => {
  const { login, register } = useSiteUser()
  const [tab, setTab] = useState<number>(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Create Account fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const handleSignIn = async () => {
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    const ok = await login(loginEmail, loginPassword)
    setLoading(false)
    if (ok) {
      ssIdentify({ email: loginEmail })
      onClose()
      onSuccess?.()
    } else {
      setError('Invalid email or password')
    }
  }

  const handleRegister = async () => {
    if (!regEmail || !regPassword) {
      setError('Email and password are required')
      return
    }
    setLoading(true)
    setError('')
    const ok = await register(regEmail, regPassword, regName || undefined, regPhone || undefined)
    setLoading(false)
    if (ok) {
      ssIdentify({ email: regEmail, name: regName, phone: regPhone })
      // Sync to SureSend
      try {
        await fetch('/api/suresend/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: regName,
            email: regEmail,
            phone: regPhone,
            formType: 'contact',
            source: 'site_registration',
            message: 'New site user registration',
          }),
        })
      } catch {
        // non-critical
      }
      onClose()
      onSuccess?.()
    } else {
      setError('Registration failed. Email may already be in use.')
    }
  }

  const handleKeyDown = (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handler()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Typography variant="h6" fontWeight={600}>Welcome</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setError('') }} sx={{ mb: 2 }}>
          <Tab label="Sign In" />
          <Tab label="Create Account" />
        </Tabs>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onKeyDown={handleKeyDown(handleSignIn)}
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={handleKeyDown(handleSignIn)}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSignIn}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{ mt: 1, bgcolor: '#0F1621', '&:hover': { bgcolor: '#1a2433' } }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              autoFocus
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
            />
            <TextField
              label="Phone"
              type="tel"
              fullWidth
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              onKeyDown={handleKeyDown(handleRegister)}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleRegister}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{ mt: 1, bgcolor: '#0F1621', '&:hover': { bgcolor: '#1a2433' } }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default LoginDialog
