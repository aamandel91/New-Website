import Link from 'next/link'

import { Box, Button, Typography } from '@mui/material'

const PLACEHOLDER_ARTICLES = [
  {
    title: 'Cost of Living in Pembroke Pines FL (2026)',
    category: 'Moving To & Living In Guides',
    author: 'Andy Mandel',
    date: 'March 31, 2026'
  },
  {
    title: 'Buying a Home with an HOA in Florida (2026)',
    category: 'Home Buying',
    author: 'Andy Mandel',
    date: 'March 31, 2026'
  },
  {
    title: 'Cost of Living in Cooper City FL (2026)',
    category: 'Moving To & Living In Guides',
    author: 'Andy Mandel',
    date: 'March 30, 2026'
  }
]

const BlogSection = () => (
  <Box sx={{ bgcolor: '#2C2C2C', py: { xs: 6, md: 10 }, px: { xs: 3, md: 6 } }}>
    <Box
      sx={{
        maxWidth: '1200px',
        mx: 'auto',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 4, md: 6 }
      }}
    >
      {/* Left Column */}
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: { xs: '60px', md: '120px' },
            fontWeight: 100,
            color: '#555',
            lineHeight: 1,
            mb: 3,
            textTransform: 'uppercase'
          }}
        >
          Florida Home Finder
        </Typography>
        <Box sx={{ width: '60px', height: '3px', bgcolor: '#00B5AD', mb: 3 }} />
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '14px',
            lineHeight: 1.8,
            mb: 4
          }}
        >
          Catch up on the latest South Florida real estate news, tips, local insights and advice
          on a variety of home-related topics. Educated buyers and sellers typically make smarter
          decisions when it comes to real estate. We strive to keep you informed on the latest
          South Florida real estate news.
        </Typography>
        <Link href="/blog" style={{ textDecoration: 'none' }}>
          <Button
            variant="outlined"
            sx={{
              color: '#fff',
              borderColor: '#fff',
              fontSize: '12px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              px: 4,
              py: 1.5,
              borderRadius: '30px',
              '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Read More
          </Button>
        </Link>
      </Box>

      {/* Right Column — Article Cards */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {PLACEHOLDER_ARTICLES.map((article) => (
          <Box
            key={article.title}
            sx={{
              bgcolor: '#fff',
              borderRadius: '6px',
              display: 'flex',
              overflow: 'hidden',
              minHeight: '120px'
            }}
          >
            {/* Thumbnail placeholder */}
            <Box
              sx={{
                width: '140px',
                minWidth: '140px',
                background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                display: { xs: 'none', sm: 'block' }
              }}
            />
            {/* Content */}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography
                sx={{
                  color: '#00B5AD',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  mb: 0.5
                }}
              >
                {article.category}
              </Typography>
              <Typography
                sx={{
                  color: '#333',
                  fontSize: '15px',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  mb: 1
                }}
              >
                {article.title}
              </Typography>
              <Typography sx={{ color: '#999', fontSize: '12px' }}>
                BY {article.author} &middot; {article.date}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
)

export default BlogSection
