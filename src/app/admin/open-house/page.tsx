'use client'

import { useEffect, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import CopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import ViewIcon from '@mui/icons-material/Visibility'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'

import type { OpenHouseVisitor } from '@/types/openHouse'

interface SessionSummary {
  id: string
  mlsNumber: string
  agentName: string
  agentEmail: string
  propertyAddress: string
  propertyImage: string
  propertyPrice: string
  createdAt: string
  visitorCount: number
}

export default function AdminOpenHousePage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    sessionId?: string
  }>({ open: false })
  const [deleting, setDeleting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Visitor dialog
  const [visitorDialog, setVisitorDialog] = useState<{
    open: boolean
    sessionId?: string
    propertyAddress?: string
  }>({ open: false })
  const [visitors, setVisitors] = useState<OpenHouseVisitor[]>([])
  const [loadingVisitors, setLoadingVisitors] = useState(false)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/open-house')
      if (!res.ok) throw new Error('Failed to load sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleDelete = async () => {
    if (!deleteDialog.sessionId) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/open-house/${deleteDialog.sessionId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      setSessions(sessions.filter((s) => s.id !== deleteDialog.sessionId))
      setDeleteDialog({ open: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyUrl = async (sessionId: string) => {
    const url = `${window.location.origin}/open-house/sign-in/${sessionId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopySuccess(true)
    }
  }

  const handleViewVisitors = async (
    sessionId: string,
    propertyAddress: string
  ) => {
    setVisitorDialog({ open: true, sessionId, propertyAddress })
    setLoadingVisitors(true)

    try {
      const res = await fetch(`/api/open-house/${sessionId}/visitors`)
      if (!res.ok) throw new Error('Failed to load visitors')
      const data = await res.json()
      setVisitors(data.visitors || [])
    } catch {
      setVisitors([])
    } finally {
      setLoadingVisitors(false)
    }
  }

  const handleExportCsv = (sessionId: string) => {
    window.open(`/api/open-house/${sessionId}/visitors?format=csv`, '_blank')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Typography variant="h3">Open House Management</Typography>
          <Button variant="contained" href="/open-house" target="_blank">
            Create Open House
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Alert severity="info">
            No open house sessions yet. Create one to get started!
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Property</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Visitors
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        {session.propertyImage && (
                          <Box
                            component="img"
                            src={session.propertyImage}
                            alt="Property"
                            sx={{
                              width: 60,
                              height: 45,
                              objectFit: 'cover',
                              borderRadius: 0.5
                            }}
                          />
                        )}
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ maxWidth: 300 }}
                            noWrap
                          >
                            {session.propertyAddress}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            MLS# {session.mlsNumber}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{session.agentName}</TableCell>
                    <TableCell>{formatDate(session.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={session.visitorCount}
                        color={session.visitorCount > 0 ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="View visitors">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleViewVisitors(
                                session.id,
                                session.propertyAddress
                              )
                            }
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export CSV">
                          <IconButton
                            size="small"
                            onClick={() => handleExportCsv(session.id)}
                            disabled={session.visitorCount === 0}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy sign-in URL">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyUrl(session.id)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete session">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                sessionId: session.id
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false })}
        >
          <DialogTitle>Delete Open House Session?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this open house session and all
              its visitor data? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false })}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Visitors Dialog */}
        <Dialog
          open={visitorDialog.open}
          onClose={() => setVisitorDialog({ open: false })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="h6">Visitors</Typography>
                <Typography variant="body2" color="text.secondary">
                  {visitorDialog.propertyAddress}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {visitorDialog.sessionId && visitors.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportCsv(visitorDialog.sessionId!)}
                  >
                    Export CSV
                  </Button>
                )}
                <IconButton onClick={() => setVisitorDialog({ open: false })}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {loadingVisitors ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : visitors.length === 0 ? (
              <Typography
                color="text.secondary"
                textAlign="center"
                sx={{ py: 4 }}
              >
                No visitors have signed in yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Working w/ Agent
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>How Heard</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Pre-Approved
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visitors.map((visitor) => (
                      <TableRow key={visitor.id} hover>
                        <TableCell>{visitor.name}</TableCell>
                        <TableCell>{visitor.email}</TableCell>
                        <TableCell>{visitor.phone}</TableCell>
                        <TableCell>
                          {visitor.workingWithAgent === 'yes' ? (
                            <Chip label="Yes" color="warning" size="small" />
                          ) : visitor.workingWithAgent === 'no' ? (
                            <Chip label="No" color="success" size="small" />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{visitor.hearAbout || '—'}</TableCell>
                        <TableCell>
                          {visitor.preApproved === 'yes' ? (
                            <Chip label="Yes" color="success" size="small" />
                          ) : visitor.preApproved === 'no' ? (
                            <Chip label="No" size="small" />
                          ) : visitor.preApproved === 'not_yet' ? (
                            <Chip label="Not Yet" color="info" size="small" />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDate(visitor.signedInAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
        </Dialog>

        <Snackbar
          open={copySuccess}
          autoHideDuration={2000}
          onClose={() => setCopySuccess(false)}
          message="Sign-in URL copied to clipboard"
        />
      </Box>
    </Container>
  )
}
