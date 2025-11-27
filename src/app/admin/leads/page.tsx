'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import APILeads, { type Lead, type LeadFilters } from '@/services/API/APILeads'

const STATUSES = ['new', 'contacted', 'qualified', 'showing', 'offer', 'under_contract', 'closed', 'lost']
const SOURCES = ['ppc', 'organic', 'direct', 'referral', 'website', 'facebook', 'zillow']

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  new: 'primary',
  contacted: 'info',
  qualified: 'secondary',
  showing: 'warning',
  offer: 'warning',
  under_contract: 'warning',
  closed: 'success',
  lost: 'error'
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 20

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [page, statusFilter, sourceFilter])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: LeadFilters = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage
      }

      if (statusFilter) filters.status = statusFilter
      if (sourceFilter) filters.source = sourceFilter
      if (search) filters.search = search

      const response = await APILeads.getLeads(filters)
      setLeads(response.leads)
      setTotal(response.total)
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1) // Reset to first page
    fetchLeads()
  }

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setViewDialogOpen(true)
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      await APILeads.deleteLead(id)
      fetchLeads()
    } catch (err: any) {
      alert('Failed to delete lead')
    }
  }

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Leads
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Lead
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              sx={{ flexGrow: 1 }}
              placeholder="Search by name, email, or phone"
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Source</InputLabel>
              <Select
                value={sourceFilter}
                label="Source"
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {SOURCES.map((source) => (
                  <MenuItem key={source} value={source}>
                    {source.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Stack>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No leads found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>
                        {lead.first_name} {lead.last_name}
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone || '-'}</TableCell>
                      <TableCell>
                        {lead.source ? (
                          <Chip label={lead.source.toUpperCase()} size="small" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={STATUS_COLORS[lead.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>{lead.assigned_to || 'Unassigned'}</TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleViewLead(lead)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => alert('Edit not implemented yet')}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteLead(lead.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} />
          </Box>
        )}
      </Box>

      {/* View Lead Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lead Details</DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography>
                  {selectedLead.first_name} {selectedLead.last_name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography>{selectedLead.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography>{selectedLead.phone || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Source
                </Typography>
                <Typography>{selectedLead.source || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedLead.status.replace('_', ' ').toUpperCase()}
                  size="small"
                  color={STATUS_COLORS[selectedLead.status] || 'default'}
                />
              </Box>
              {selectedLead.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography>{selectedLead.notes}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
