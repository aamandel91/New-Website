/**
 * Function to get matching listings for a saved search using the Repliers API.
 *
 * @param {Object} args - Arguments for retrieving saved search matches.
 * @param {string} args.id - Saved search ID.
 * @param {number} [args.resultsPerPage] - Number of results per page.
 * @param {number} [args.pageNum] - Page number.
 * @returns {Promise<Object>} - The result of retrieving saved search matches.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  const defaultResultsPerPage = Number(process.env.RESULTS_PER_PAGE) || 20
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/saved-searches/${args.id}/matches`)

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
    console.error('Error retrieving saved search matches:', error)
    return {
      error: 'An error occurred while retrieving saved search matches.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for retrieving saved search matches using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_saved_search_matches',
      description:
        'Get the current matching listings for a saved search. Returns properties that match the saved search criteria.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Saved search ID.'
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
        required: ['id']
      }
    }
  }
}

export { apiTool }
