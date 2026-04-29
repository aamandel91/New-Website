/**
 * Function to list brokerage offices from the MLS directory using the Repliers API.
 *
 * @param {Object} args - Arguments for filtering offices.
 * @param {number} [args.boardId] - MLS board ID.
 * @param {string} [args.brokerageName] - Filter by brokerage name.
 * @param {string} [args.city] - Filter by city.
 * @param {number} [args.resultsPerPage] - Number of results per page.
 * @param {number} [args.pageNum] - Page number.
 * @returns {Promise<Object>} - The result of listing offices.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  const defaultResultsPerPage = Number(process.env.RESULTS_PER_PAGE) || 20
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/offices`)

    if (args.boardId !== undefined) {
      url.searchParams.set('boardId', String(args.boardId))
    }
    if (args.brokerageName) {
      url.searchParams.set('brokerageName', args.brokerageName)
    }
    if (args.city) {
      url.searchParams.set('city', args.city)
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
    console.error('Error retrieving offices:', error)
    return {
      error: 'An error occurred while retrieving offices.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for retrieving offices using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_offices',
      description:
        'List brokerage offices from the MLS directory. A brokerage may have one or more offices.',
      parameters: {
        type: 'object',
        properties: {
          boardId: {
            type: 'number',
            description: 'MLS board ID.'
          },
          brokerageName: {
            type: 'string',
            description: 'Filter by brokerage name.'
          },
          city: {
            type: 'string',
            description: 'Filter by city.'
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
