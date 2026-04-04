'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import FavoriteIcon from '@mui/icons-material/Favorite'

import { useSiteUser } from 'providers/SiteUserProvider'
import LoginDialog from 'components/auth/LoginDialog'

export default function FavoritesPage() {
  const { isLoggedIn, user, removeFavorite } = useSiteUser()
  const [loginOpen, setLoginOpen] = useState(false)

  if (!isLoggedIn) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <FavoriteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Sign in to see your favorites</Typography>
        <Button variant="contained" onClick={() => setLoginOpen(true)} sx={{ mt: 2, bgcolor: '#0F1621' }}>
          Sign In / Register
        </Button>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Container>
    )
  }

  const favorites = user?.favorites || []

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Favorites
      </Typography>

      {favorites.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            No favorites yet. Click the heart icon on any property to save it here.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {favorites.map((fav) => (
            <Grid item xs={12} sm={6} md={4} key={fav.mlsNumber}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardMedia
                  component="a"
                  href={`/listing/${fav.mlsNumber}`}
                  sx={{
                    height: 180,
                    bgcolor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  <Typography color="text.secondary">MLS# {fav.mlsNumber}</Typography>
                </CardMedia>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      {fav.price && (
                        <Typography variant="h6" fontWeight={700}>
                          ${Number(fav.price).toLocaleString()}
                        </Typography>
                      )}
                      {fav.address && (
                        <Typography variant="body2" color="text.secondary">
                          {fav.address}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Saved {new Date(fav.savedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeFavorite(fav.mlsNumber)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
