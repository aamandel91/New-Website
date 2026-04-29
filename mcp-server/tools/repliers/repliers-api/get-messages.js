/**
 * Function to retrieve messages using the Repliers API.
 *
 * @param {Object} args - Arguments for retrieving messages.
 * @param {string} [args.clientId] - Filter by client ID.
 * @param {string} [args.agentId] - Filter by agent ID.
 * @param {number} [args.resultsPerPage] - Number of results per page.
 * @param {number} [args.pageNum] - Page number.
 * @returns {Promise<Object>} - The result of retrieving messages.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  const defaultResultsPerPage = Number(process.env.RESULTS_PER_PAGE) || 20
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/messages`)

    if (args.clientId) {
      url.searchParams.set('clientId', args.clientId)
    }
    if (args.agentId) {
      url.searchParams.set('agentId', args.agentId)
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
    console.error('Error retrieving messages:', error)
    return {
      error: 'An error occurred while retrieving messages.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for retrieving messages using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_messages',
      description:
        'Get messages sent to or received from clients. Filter by client or agent.',
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'Filter by client ID.'
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
