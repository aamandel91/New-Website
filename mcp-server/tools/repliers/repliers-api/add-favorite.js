/**
 * Function to add a listing to a client's favorites using the Repliers API.
 *
 * @param {Object} args - Arguments for adding a favorite.
 * @param {string} args.clientId - Client ID.
 * @param {string} args.mlsNumber - MLS number of the listing.
 * @param {number} [args.boardId] - MLS board ID.
 * @returns {Promise<Object>} - The result of adding the favorite.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/favorites`)

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'REPLIERS-API-KEY': apiKey
    }

    finalUrl = url.toString()

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(args)
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
    console.error('Error adding favorite:', error)
    return {
      error: 'An error occurred while adding the favorite.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for adding a favorite using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'add_favorite',
      description: "Add a listing to a client's favorites.",
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'Client ID.'
          },
          mlsNumber: {
            type: 'string',
            description: 'MLS number of the listing.'
          },
          boardId: {
            type: 'number',
            description: 'MLS board ID.'
          }
        },
        required: ['clientId', 'mlsNumber']
      }
    }
  }
}

export { apiTool }
