/**
 * Function to list all webhook subscriptions using the Repliers API.
 *
 * @param {Object} args - Arguments (none required).
 * @returns {Promise<Object>} - The result of listing webhooks.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/webhooks`)

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
    console.error('Error retrieving webhooks:', error)
    return {
      error: 'An error occurred while retrieving webhooks.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for listing webhooks using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_webhooks',
      description: 'List all webhook subscriptions.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
}

export { apiTool }
