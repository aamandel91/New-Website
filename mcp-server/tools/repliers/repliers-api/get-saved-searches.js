/**
 * Function to list saved searches using the Repliers API.
 *
 * @param {Object} args - Arguments for listing saved searches.
 * @param {string} [args.clientId] - Filter by client ID.
 * @param {string} [args.id] - Filter by saved search ID.
 * @param {number} [args.resultsPerPage] - Number of results per page.
 * @param {number} [args.pageNum] - Page number.
 * @returns {Promise<Object>} - The result of listing saved searches.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  const defaultResultsPerPage = Number(process.env.RESULTS_PER_PAGE) || 20
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/saved-searches`)

    if (args.clientId) {
      url.searchParams.set('clientId', args.clientId)
    }
    if (args.id) {
      url.searchParams.set('id', args.id)
    }
    if (args.pageNum !== undefined) {
      url.searchParams.set('pageNum', String(args.pageNum))
    }
    const resultsPerPage = args.resultsPerPage || defaultResultsPerPage
    url.searchParams.set('resultsPerPage', String(resultsPerPage))

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
    console.error('Error retrieving saved searches:', error)
    return {
      error: 'An error occurred while retrieving saved searches.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for listing saved searches using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_saved_searches',
      description:
        "List saved searches. Filter by client ID to see a specific client's saved searches.",
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'Filter by client ID.'
          },
          id: {
            type: 'string',
            description: 'Filter by saved search ID.'
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
