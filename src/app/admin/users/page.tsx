'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { getTokenSync } from 'utils/tokens'

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`

interface AdminUser {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  created_at: string
  updated_at?: string
}

interface UserFormData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: string
}

const emptyForm: UserFormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'admin'
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = getTokenSync()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || `Request failed (${res.status})`)
  }
  return res.json()
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UserFormData>(emptyForm)
  const [formError, setFormError] = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/admin/users')
      setUsers(data)
      setError('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleOpenAdd = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setFormError('')
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user)
    setForm({
      email: user.email,
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setFormError('')
    try {
      if (editingUser) {
        const body: Record<string, string> = {}
        if (form.email !== editingUser.email) body.email = form.email
        if (form.first_name !== (editingUser.first_name || '')) body.first_name = form.first_name
        if (form.last_name !== (editingUser.last_name || '')) body.last_name = form.last_name
        if (form.role !== editingUser.role) body.role = form.role
        if (form.password) body.password = form.password

        await apiFetch(`/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body)
        })
      } else {
        if (!form.email || !form.password) {
          setFormError('Email and password are required')
          return
        }
        await apiFetch('/admin/users', {
          method: 'POST',
          body: JSON.stringify(form)
        })
      }
      setDialogOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save user'
      setFormError(message)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
      setDeleteConfirmId(null)
      fetchUsers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      setError(message)
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Admin Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{
            bgcolor: '#C4A96E',
            color: '#0F1621',
            fontWeight: 600,
            '&:hover': { bgcolor: '#b89a5e' }
          }}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0F1621' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {[user.first_name, user.last_name].filter(Boolean).join(' ') || '-'}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(user)}
                      sx={{ color: '#C4A96E' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteConfirmId(user.id)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? 'Edit User' : 'Add User'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
            required
            size="small"
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label={editingUser ? 'Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            fullWidth
            required={!editingUser}
            size="small"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              fullWidth
              size="small"
            />
          </Box>
          <Select
            value={form.role}
            onChange={(e: SelectChangeEvent) => setForm({ ...form, role: e.target.value })}
            fullWidth
            size="small"
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              bgcolor: '#C4A96E',
              color: '#0F1621',
              fontWeight: 600,
              '&:hover': { bgcolor: '#b89a5e' }
            }}
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
