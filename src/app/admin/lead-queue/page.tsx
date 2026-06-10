'use client'

import { useCallback, useEffect, useState } from 'react'

import DeleteIcon from '@mui/icons-material/Delete'
import ReplayIcon from '@mui/icons-material/Replay'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'

const GOLD = '#C4A96E'

interface QueuedLead {
  id: string
  payload: {
    name: string
    email: string
    phone?: string
    formType: string
    propertyAddress?: string
    source?: string
  }
  queueSource: string
  reason: string
  attempts: number
  createdAt: string
  lastAttemptAt: string | null
}

const SOURCE_LABELS: Record<string, string> = {
  lead_form: 'Website Form',
  open_house_session: 'Open House (QR)',
  open_house_form: 'Open House (Form)'
}

export default function LeadQueuePage() {
  const [leads, setLeads] = useState<QueuedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [retryingAll, setRetryingAll] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<QueuedLead | null>(null)
  const [snack, setSnack] = useState<{
    message: string
    severity: 'success' | 'error' | 'warning'
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/lead-queue')
      if (!res.ok) throw new Error(`Failed to load queue (${res.status})`)
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const retry = async (id?: string) => {
    if (id) setBusyId(id)
    else setRetryingAll(true)
    try {
      const res = await fetch('/api/admin/lead-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : { all: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Retry failed')
      if (data.failed === 0) {
        setSnack({
          message: `${data.succeeded} lead${data.succeeded === 1 ? '' : 's'} synced to SureSend`,
          severity: 'success'
        })
      } else {
        setSnack({
          message: `${data.succeeded} synced, ${data.failed} still failing — check the error column`,
          severity: 'warning'
        })
      }
      await load()
    } catch (err) {
      setSnack({
        message: err instanceof Error ? err.message : 'Retry failed',
        severity: 'error'
      })
    } finally {
      setBusyId(null)
      setRetryingAll(false)
    }
  }

  const remove = async (lead: QueuedLead) => {
    setConfirmDelete(null)
    setBusyId(lead.id)
    try {
      const res = await fetch('/api/admin/lead-queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id })
      })
      if (!res.ok) throw new Error('Delete failed')
      setSnack({ message: 'Lead removed from queue', severity: 'success' })
      await load()
    } catch (err) {
      setSnack({
        message: err instanceof Error ? err.message : 'Delete failed',
        severity: 'error'
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Lead Retry Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Leads that failed to sync to SureSend. Nothing here is lost —
            retry after fixing the cause (usually the API token or an
            outage).
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={
            retryingAll ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ReplayIcon />
            )
          }
          disabled={leads.length === 0 || retryingAll}
          onClick={() => retry()}
          sx={{ bgcolor: GOLD, '&:hover': { bgcolor: '#b3955c' } }}
        >
          Retry All ({leads.length})
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: GOLD }} />
        </Box>
      ) : leads.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Queue is empty 🎉
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every captured lead has made it into SureSend. Failed syncs will
            appear here automatically.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lead</TableCell>
                <TableCell>Form</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Error</TableCell>
                <TableCell align="center">Attempts</TableCell>
                <TableCell>Queued</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {lead.payload.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lead.payload.email}
                      {lead.payload.phone ? ` · ${lead.payload.phone}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lead.payload.formType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {SOURCE_LABELS[lead.queueSource] || lead.queueSource}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Typography variant="caption" noWrap display="block">
                      {lead.payload.propertyAddress || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Tooltip title={lead.reason}>
                      <Typography
                        variant="caption"
                        color="error"
                        noWrap
                        display="block"
                      >
                        {lead.reason}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">{lead.attempts}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(lead.createdAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Retry sync">
                      <span>
                        <IconButton
                          size="small"
                          disabled={busyId === lead.id || retryingAll}
                          onClick={() => retry(lead.id)}
                        >
                          {busyId === lead.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <ReplayIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove without syncing">
                      <span>
                        <IconButton
                          size="small"
                          disabled={busyId === lead.id || retryingAll}
                          onClick={() => setConfirmDelete(lead)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Remove lead from queue?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmDelete?.payload.name} ({confirmDelete?.payload.email}) will
            be removed WITHOUT syncing to SureSend. This lead will be lost
            permanently.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDelete && remove(confirmDelete)}
          >
            Remove Permanently
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity || 'success'} variant="filled">
          {snack?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
