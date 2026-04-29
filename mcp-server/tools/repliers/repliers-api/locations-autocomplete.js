/**
 * Function to perform type-ahead autocomplete for locations using the Repliers API.
 *
 * @param {Object} args - Arguments for the autocomplete search.
 * @param {string} args.search - Partial location string to autocomplete.
 * @param {number} [args.boardId] - MLS board ID.
 * @returns {Promise<Object>} - The result of the autocomplete search.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/locations/autocomplete`)

    url.searchParams.set('search', args.search)
    if (args.boardId !== undefined) {
      url.searchParams.set('boardId', String(args.boardId))
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
    console.error('Error running locations autocomplete:', error)
    return {
      error: 'An error occurred while running the locations autocomplete.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for locations autocomplete using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'locations_autocomplete',
      description:
        'Type-ahead autocomplete for locations. Returns matching areas, cities, and neighborhoods as the user types. Typo-tolerant.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Partial location string to autocomplete.'
          },
          boardId: {
            type: 'number',
            description: 'MLS board ID.'
          }
        },
        required: ['search']
      }
    }
  }
}

export { apiTool }
