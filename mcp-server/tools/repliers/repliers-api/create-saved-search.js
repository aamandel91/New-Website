/**
 * Function to create a saved search for a client using the Repliers API.
 *
 * @param {Object} args - Arguments for creating the saved search.
 * @param {string} args.clientId - Client ID to associate the saved search with.
 * @param {Object} args.filters - Search filters matching the listings search params.
 * @param {string} [args.name] - Saved search name.
 * @param {string} [args.frequency] - Notification frequency: "daily", "weekly", "realtime".
 * @returns {Promise<Object>} - The result of creating the saved search.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/saved-searches`)

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
    console.error('Error creating the saved search:', error)
    return {
      error: 'An error occurred while creating the saved search.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for creating a saved search using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_saved_search',
      description:
        "Create a saved search for a client. The system will automatically notify the client when new listings match their criteria. Filters must be specific enough that initial matches don't exceed 100 listings.",
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'Client ID to associate the saved search with.'
          },
          name: {
            type: 'string',
            description: 'Saved search name.'
          },
          filters: {
            type: 'object',
            description:
              'Search filters matching the listings search params (city, minPrice, maxPrice, minBedrooms, propertyType, class, etc.).'
          },
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'realtime'],
            description: 'Notification frequency.'
          }
        },
        required: ['clientId', 'filters']
      }
    }
  }
}

export { apiTool }
