/**
 * Function to list and filter clients using the Repliers API.
 *
 * @param {Object} args - Arguments for filtering clients.
 * @param {string} [args.id] - If provided, fetch a single client by ID.
 * @param {string} [args.email] - Filter by email.
 * @param {string} [args.firstName] - Filter by first name.
 * @param {string} [args.lastName] - Filter by last name.
 * @param {string} [args.agentId] - Filter by agent ID.
 * @param {number} [args.resultsPerPage] - Number of results per page.
 * @param {number} [args.pageNum] - Page number.
 * @returns {Promise<Object>} - The result of listing clients.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  const defaultResultsPerPage = Number(process.env.RESULTS_PER_PAGE) || 20
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/clients`)

    if (args.id) {
      url.pathname = `/clients/${args.id}`
    } else {
      if (args.email) {
        url.searchParams.set('email', args.email)
      }
      if (args.firstName) {
        url.searchParams.set('firstName', args.firstName)
      }
      if (args.lastName) {
        url.searchParams.set('lastName', args.lastName)
      }
      if (args.agentId) {
        url.searchParams.set('agentId', args.agentId)
      }
      if (args.pageNum !== undefined) {
        url.searchParams.set('pageNum', String(args.pageNum))
      }
      const resultsPerPage = args.resultsPerPage || defaultResultsPerPage
      url.searchParams.set('resultsPerPage', String(resultsPerPage))
    }

    const headers = {
      Accept: 'application/json',
      'REPLIERS-API-KEY': apiKey
    }

    finalUrl = url.toString()

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(JSON.stringify(errorData))
    }

    const data = await response.json()
    return {
      url: finalUrl,
      data
    }
  } catch (error) {
    console.error('Error retrieving clients:', error)
    return {
      error: 'An error occurred while retrieving clients.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for retrieving clients using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_clients',
      description:
        'List and filter clients. Filter by email, name, agent ID, or get all. If id is provided, retrieves the single client at /clients/:id.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description:
              'If provided, retrieves a single client by ID using the /clients/:id path.'
          },
          email: {
            type: 'string',
            description: 'Filter by email.'
          },
          firstName: {
            type: 'string',
            description: 'Filter by first name.'
          },
          lastName: {
            type: 'string',
            description: 'Filter by last name.'
          },
          agentId: {
            type: 'string',
            description: 'Filter by agent ID.'
          },
          resultsPerPage: {
            type: 'number',
            description: 'Number of results per page.'
          },
          pageNum: {
            type: 'number',
            description: 'Page number for pagination.'
          }
        },
        required: []
      }
    }
  }
}

export { apiTool }
