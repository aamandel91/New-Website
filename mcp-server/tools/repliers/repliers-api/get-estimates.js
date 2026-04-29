/**
 * Function to retrieve previously created property estimates from the Repliers API.
 *
 * @param {Object} args - Arguments for retrieving estimates.
 * @param {number} [args.boardId] - MLS board ID.
 * @param {string} [args.city] - Filter by city.
 * @param {string} [args.streetName] - Filter by street name.
 * @param {string} [args.streetNumber] - Filter by street number.
 * @param {string} [args.zip] - Filter by zip code.
 * @param {string} [args.id] - Filter by estimate ID.
 * @param {number} [args.resultsPerPage] - Number of results per page.
 * @param {number} [args.pageNum] - Page number.
 * @returns {Promise<Object>} - The result of retrieving estimates.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  const defaultResultsPerPage = Number(process.env.RESULTS_PER_PAGE) || 20
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/estimates`)

    if (args.boardId !== undefined) {
      url.searchParams.set('boardId', String(args.boardId))
    }
    if (args.city) {
      url.searchParams.set('city', args.city)
    }
    if (args.streetName) {
      url.searchParams.set('streetName', args.streetName)
    }
    if (args.streetNumber) {
      url.searchParams.set('streetNumber', args.streetNumber)
    }
    if (args.zip) {
      url.searchParams.set('zip', args.zip)
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
    console.error('Error retrieving estimates:', error)
    return {
      error: 'An error occurred while retrieving estimates.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for retrieving property estimates using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_estimates',
      description:
        'Retrieve previously created property estimates. Can filter by boardId, address components, or estimate ID.',
      parameters: {
        type: 'object',
        properties: {
          boardId: {
            type: 'number',
            description: 'MLS board ID.'
          },
          city: {
            type: 'string',
            description: 'Filter by city.'
          },
          streetName: {
            type: 'string',
            description: 'Filter by street name.'
          },
          streetNumber: {
            type: 'string',
            description: 'Filter by street number.'
          },
          zip: {
            type: 'string',
            description: 'Filter by zip code.'
          },
          id: {
            type: 'string',
            description: 'Filter by estimate ID.'
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
