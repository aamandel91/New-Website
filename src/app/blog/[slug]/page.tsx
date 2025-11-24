import { Suspense } from 'react'
import { Box, Container, Typography, Grid, CircularProgress } from '@mui/material'
import { BlogDisplay, BlogListing } from '@pages'
import type { Metadata } from 'next'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export const metadata: Metadata = {
  title: 'Blog Post | Florida Home Finder',
  description: 'Read our latest blog post about real estate and lifestyle'
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const handleRelatedBlogs = (blogs: any[]) => {
    // This could update state if we had client-side handling
    console.log('Related blogs:', blogs)
  }

  return (
    <Box>
      <BlogDisplay slug={params.slug} onRelatedBlogs={handleRelatedBlogs} />

      {/* Related Articles Section */}
      <Box sx={{ bgcolor: '#f9f9f9', py: 8, mt: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ mb: 4, textAlign: 'center' }}>
            More Articles
          </Typography>
          <Suspense fallback={<CircularProgress sx={{ display: 'block', mx: 'auto' }} />}>
            <BlogListing featured={true} />
          </Suspense>
        </Container>
      </Box>
    </Box>
  )
}
