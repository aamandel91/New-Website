'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Alert
} from '@mui/material'
import { setToken } from 'utils/tokens'

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.message || 'Invalid credentials')
        return
      }

      setToken(data.token)
      router.push('/admin')
    } catch {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0F1621',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="xs">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            p: 4
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: '#C4A96E',
              fontWeight: 700,
              textAlign: 'center',
              mb: 0.5
            }}
          >
            Admin Login
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              fontSize: 14,
              mb: 3
            }}
          >
            Sign in to the admin dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            size="small"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#C4A96E' }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.5)',
                '&.Mui-focused': { color: '#C4A96E' }
              }
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            size="small"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#C4A96E' }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.5)',
                '&.Mui-focused': { color: '#C4A96E' }
              }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              bgcolor: '#C4A96E',
              color: '#0F1621',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              py: 1.2,
              '&:hover': { bgcolor: '#b89a5e' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(196, 169, 110, 0.4)',
                color: 'rgba(15, 22, 33, 0.5)'
              }
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#0F1621' }} /> : 'Sign In'}
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
