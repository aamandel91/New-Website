'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import AddTaskIcon from '@mui/icons-material/AddTask'

interface CrmPerson {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  tags?: string[]
  stage?: string
  source?: string
  createdAt?: string
}

interface LeadStats {
  total: number
  thisWeek: number
  bySource: Record<string, number>
}

export default function AdminCrmPage() {
  const [people, setPeople] = useState<CrmPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LeadStats>({ total: 0, thisWeek: 0, bySource: {} })

  // Note dialog state
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; personId: string; personName: string }>({
    open: false,
    personId: '',
    personName: '',
  })
  const [noteSubject, setNoteSubject] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // Task dialog state
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; personId: string; personName: string }>({
    open: false,
    personId: '',
    personName: '',
  })
  const [taskName, setTaskName] = useState('')
  const [taskSubmitting, setTaskSubmitting] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/suresend/admin/leads')
      if (!res.ok) throw new Error('Failed to fetch leads')
      const data = await res.json()
      setPeople(data.people || [])
      setStats(data.stats || { total: 0, thisWeek: 0, bySource: {} })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CRM data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleAddNote = async () => {
    if (!noteSubject.trim() || !noteBody.trim()) return
    setNoteSubmitting(true)
    try {
      await fetch('/api/suresend/admin/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: noteDialog.personId,
          subject: noteSubject,
          body: noteBody,
        }),
      })
      setNoteDialog({ open: false, personId: '', personName: '' })
      setNoteSubject('')
      setNoteBody('')
    } catch {
      // silent fail
    } finally {
      setNoteSubmitting(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskName.trim()) return
    setTaskSubmitting(true)
    try {
      await fetch('/api/suresend/admin/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: taskDialog.personId,
          name: taskName,
          type: 'follow_up',
        }),
      })
      setTaskDialog({ open: false, personId: '', personName: '' })
      setTaskName('')
    } catch {
      // silent fail
    } finally {
      setTaskSubmitting(false)
    }
  }

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          CRM — Leads
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchLeads}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Total Leads</Typography>
            <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">This Week</Typography>
            <Typography variant="h4" fontWeight="bold">{stats.thisWeek}</Typography>
          </CardContent>
        </Card>
        {Object.entries(stats.bySource).map(([source, count]) => (
          <Card key={source} sx={{ minWidth: 160, flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {source.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="h4" fontWeight="bold">{count}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Tags</strong></TableCell>
                <TableCell><strong>Source</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {people.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No leads yet. Leads will appear here once forms are submitted.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                people.map((person) => (
                  <TableRow key={person.id} hover>
                    <TableCell>{person.firstName} {person.lastName}</TableCell>
                    <TableCell>{person.email || '—'}</TableCell>
                    <TableCell>{person.phone || '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(person.tags || []).slice(0, 3).map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                        {(person.tags || []).length > 3 && (
                          <Chip label={`+${person.tags!.length - 3}`} size="small" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{person.source || '—'}</TableCell>
                    <TableCell>
                      {person.createdAt
                        ? new Date(person.createdAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          startIcon={<OpenInNewIcon />}
                          href={`https://app.suresend.ai/people/${person.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<NoteAddIcon />}
                          onClick={() =>
                            setNoteDialog({
                              open: true,
                              personId: person.id,
                              personName: `${person.firstName} ${person.lastName}`,
                            })
                          }
                        >
                          Note
                        </Button>
                        <Button
                          size="small"
                          startIcon={<AddTaskIcon />}
                          onClick={() =>
                            setTaskDialog({
                              open: true,
                              personId: person.id,
                              personName: `${person.firstName} ${person.lastName}`,
                            })
                          }
                        >
                          Task
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Note Dialog */}
      <Dialog open={noteDialog.open} onClose={() => setNoteDialog({ open: false, personId: '', personName: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note — {noteDialog.personName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Subject"
              fullWidth
              size="small"
              value={noteSubject}
              onChange={(e) => setNoteSubject(e.target.value)}
            />
            <TextField
              label="Note"
              fullWidth
              multiline
              rows={4}
              size="small"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog({ open: false, personId: '', personName: '' })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddNote} disabled={noteSubmitting}>
            {noteSubmitting ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={taskDialog.open} onClose={() => setTaskDialog({ open: false, personId: '', personName: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Create Task — {taskDialog.personName}</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Name"
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialog({ open: false, personId: '', personName: '' })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddTask} disabled={taskSubmitting}>
            {taskSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
