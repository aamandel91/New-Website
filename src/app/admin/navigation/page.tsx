'use client'

/**
 * Custom navigation items editor.
 *
 * This admin page edits database-stored custom nav items: external links,
 * mega menus, dropdowns, banner alerts, etc.
 *
 * It does NOT edit:
 * - The hardcoded property-type items (Condos, Single Family Homes, etc)
 *   — those are auto-generated from src/configs/defaults/page-generation.ts
 *   in src/components/templates/components/Header/navData.ts
 * - The hardcoded city items (Boca Raton, Fort Lauderdale, etc)
 *   — those are the `cities` array in navData.ts
 *
 * If you need to change a hardcoded nav item, edit navData.ts directly.
 */

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
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import DragIcon from '@mui/icons-material/DragIndicator'
import APINavigation, { type NavigationItem, type CreateNavigationItemInput } from '@/services/API/APINavigation'

const POSITIONS = ['left', 'right', 'mobile', 'footer']
const NAV_TYPES = ['internal', 'external', 'dropdown', 'mega_menu']

export default function NavigationPage() {
  const [items, setItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [positionFilter, setPositionFilter] = useState<string>('left')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null)
  const [formData, setFormData] = useState<CreateNavigationItemInput>({
    label: '',
    type: 'internal',
    position: 'left',
    url: '',
    is_visible: true,
    open_new_tab: false
  })

  useEffect(() => {
    fetchItems()
  }, [positionFilter])

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: any = {}
      if (positionFilter) filters.position = positionFilter

      const response = await APINavigation.getItems(filters)
      setItems(response.items)
    } catch (err: any) {
      setError(err?.message || 'Failed to load navigation items')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (item?: NavigationItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        label: item.label,
        type: item.type,
        position: item.position,
        url: item.url || '',
        page_id: item.page_id || undefined,
        icon: item.icon || undefined,
        dropdown_items: item.dropdown_items,
        mega_menu_config: item.mega_menu_config || undefined,
        is_visible: item.is_visible,
        open_new_tab: item.open_new_tab
      })
    } else {
      setEditingItem(null)
      setFormData({
        label: '',
        type: 'internal',
        position: positionFilter || 'left',
        url: '',
        is_visible: true,
        open_new_tab: false
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
  }

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await APINavigation.updateItem(editingItem.id, formData)
      } else {
        await APINavigation.createItem(formData)
      }
      handleCloseDialog()
      fetchItems()
    } catch (err: any) {
      alert(err?.message || 'Failed to save navigation item')
    }
  }

  const handleDeleteItem = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return

    try {
      await APINavigation.deleteItem(id)
      fetchItems()
    } catch (err: any) {
      alert('Failed to delete navigation item')
    }
  }

  const handleToggleVisibility = async (id: string) => {
    try {
      await APINavigation.toggleVisibility(id)
      fetchItems()
    } catch (err: any) {
      alert('Failed to toggle visibility')
    }
  }

  const handleDuplicateItem = async (id: string) => {
    try {
      await APINavigation.duplicateItem(id)
      fetchItems()
    } catch (err: any) {
      alert('Failed to duplicate navigation item')
    }
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Navigation Builder
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Item
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Position Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Navigation Position</InputLabel>
              <Select
                value={positionFilter}
                label="Navigation Position"
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                {POSITIONS.map((pos) => (
                  <MenuItem key={pos} value={pos}>
                    {pos.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Drag items to reorder (coming soon)
            </Typography>
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
                  <TableCell width={50}></TableCell>
                  <TableCell>Label</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Visible</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No navigation items found for this position
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <DragIcon sx={{ cursor: 'move', color: 'text.secondary' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.type.toUpperCase()} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.url || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.is_visible ? (
                          <Chip label="Visible" size="small" color="success" />
                        ) : (
                          <Chip label="Hidden" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleVisibility(item.id)}
                        >
                          {item.is_visible ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDuplicateItem(item.id)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(item.id, item.label)}
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
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Navigation Item' : 'Add Navigation Item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Label"
              fullWidth
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {NAV_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.type !== 'dropdown' && formData.type !== 'mega_menu' && (
              <TextField
                label="URL"
                fullWidth
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/page-slug or https://example.com"
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={formData.position}
                label="Position"
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              >
                {POSITIONS.map((pos) => (
                  <MenuItem key={pos} value={pos}>
                    {pos.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_visible}
                      onChange={(e) =>
                        setFormData({ ...formData, is_visible: e.target.checked })
                      }
                    />
                  }
                  label="Visible"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.open_new_tab}
                      onChange={(e) =>
                        setFormData({ ...formData, open_new_tab: e.target.checked })
                      }
                    />
                  }
                  label="Open in New Tab"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
