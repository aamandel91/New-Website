const routes = {
  home: '/',
  login: '/login',

  search: '/search',
  map: '/search/map',
  ai: '/search/map?dialog=ai', // NOTE: alias for the toolbar
  grid: '/search/grid',
  table: '/search/table',
  gallery: '/search/gallery',

  city: '/search/city',
  area: '/search/area',
  address: '/search/address',

  listing: '/listing', // [...id]
  listings: '/listings',
  estimate: '/estimate',
  dashboard: '/dashboard',
  favorites: '/favorites',
  saveSearch: '/saved-searches',
  imageFavorites: '/image-favorites',
  recentlyViewed: '/recently-viewed',
  messages: '/messages',
  profile: '/profile',

  // estimates management
  admin: '/admin',
  adminAgents: '/admin/agents',

  agent: '/agent',
  agentClient: '/agent/client', // [...id]

  // static pages
  cookies: '/cookies-policy',
  privacy: '/privacy-policy',
  terms: '/terms-of-use',

  accessibility: '/accessibility',
  dmca: '/dmca',

  // will be set to home or dashboard or agent
  loginRedirect: '/'
}

export type Routes = Record<keyof typeof routes, string>

export default routes
