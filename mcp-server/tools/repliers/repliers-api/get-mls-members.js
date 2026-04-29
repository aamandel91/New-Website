/**
 * Function to list and filter MLS member agents from the MLS directory using the Repliers API.
 *
 * @param {Object} args - Arguments for filtering MLS members.
 * @param {number} [args.boardId] - MLS board ID.
 * @param {string} [args.firstName] - Filter by first name.
 * @param {string} [args.lastName] - Filter by last name.
 * @param {string} [args.brokerageName] - Filter by brokerage name.
 * @param {string} [args.officeId] - Filter by office ID.
 * @param {number} [args.resultsPerPage] - Number of results per page.
 * @param {number} [args.pageNum] - Page number.
 * @returns {Promise<Object>} - The result of listing MLS members.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  const defaultResultsPerPage = Number(process.env.RESULTS_PER_PAGE) || 20
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/members`)

    if (args.boardId !== undefined) {
      url.searchParams.set('boardId', String(args.boardId))
    }
    if (args.firstName) {
      url.searchParams.set('firstName', args.firstName)
    }
    if (args.lastName) {
      url.searchParams.set('lastName', args.lastName)
    }
    if (args.brokerageName) {
      url.searchParams.set('brokerageName', args.brokerageName)
    }
    if (args.officeId) {
      url.searchParams.set('officeId', args.officeId)
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
    console.error('Error retrieving MLS members:', error)
    return {
      error: 'An error occurred while retrieving MLS members.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for retrieving MLS members using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_mls_members',
      description:
        'List and filter MLS member agents from the MLS directory. Useful for looking up listing agents, co-operating agents, or competitor research.',
      parameters: {
        type: 'object',
        properties: {
          boardId: {
            type: 'number',
            description: 'MLS board ID.'
          },
          firstName: {
            type: 'string',
            description: 'Filter by first name.'
          },
          lastName: {
            type: 'string',
            description: 'Filter by last name.'
          },
          brokerageName: {
            type: 'string',
            description: 'Filter by brokerage name.'
          },
          officeId: {
            type: 'string',
            description: 'Filter by office ID.'
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
