'use client'

import React, { useState } from 'react'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import LoginDialog from 'components/auth/LoginDialog'

import { useSiteUser } from 'providers/SiteUserProvider'

export default function AccountSettingsPage() {
  const { isLoggedIn, user, updateProfile, deleteAccount, logout } =
    useSiteUser()
  const [loginOpen, setLoginOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [newPassword, setNewPassword] = useState('')

  if (!isLoggedIn) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Sign in to manage your account
        </Typography>
        <Button
          variant="contained"
          onClick={() => setLoginOpen(true)}
          sx={{ mt: 2, bgcolor: '#0F1621' }}
        >
          Sign In / Register
        </Button>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Container>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    const data: Record<string, string> = {}
    if (name !== (user?.name || '')) data.name = name
    if (email !== (user?.email || '')) data.email = email
    if (phone !== (user?.phone || '')) data.phone = phone
    if (newPassword) data.password = newPassword

    if (Object.keys(data).length === 0) {
      setSaving(false)
      return
    }

    const ok = await updateProfile(data)
    setSaving(false)
    if (ok) {
      setSuccess(true)
      setNewPassword('')
    } else {
      setError('Failed to update profile. Please try again.')
    }
  }

  const handleDelete = async () => {
    const ok = await deleteAccount()
    if (ok) {
      setDeleteOpen(false)
      logout()
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Account Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile updated successfully.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2.5}>
        <TextField
          label="Full Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Phone"
          type="tel"
          fullWidth
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Divider />

        <TextField
          label="New Password"
          type="password"
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          helperText="Leave blank to keep current password"
        />

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={18} color="inherit" /> : undefined
          }
          sx={{ bgcolor: '#0F1621', '&:hover': { bgcolor: '#1a2433' } }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Danger Zone
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteOpen(true)}
          >
            Delete My Account
          </Button>
        </Box>
      </Stack>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Account?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete your account, saved searches,
            favorites, and search history. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
