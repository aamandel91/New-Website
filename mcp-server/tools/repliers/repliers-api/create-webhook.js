/**
 * Function to subscribe to a webhook event using the Repliers API.
 *
 * @param {Object} args - Arguments for creating the webhook.
 * @param {string} args.url - The callback URL to receive webhook events.
 * @param {string} args.event - The event to subscribe to (e.g., "listing.new", "listing.updated", "listing.sold", "savedSearch.match").
 * @param {Object} [args.filters] - Optional filters for the webhook events.
 * @returns {Promise<Object>} - The result of creating the webhook.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/webhooks`)

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
    console.error('Error creating webhook:', error)
    return {
      error: 'An error occurred while creating the webhook.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for creating a webhook using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_webhook',
      description:
        'Subscribe to webhook events for real-time notifications on listing changes, new matches, price changes, and status updates.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The callback URL to receive webhook events.'
          },
          event: {
            type: 'string',
            description:
              'The event to subscribe to (e.g., "listing.new", "listing.updated", "listing.sold", "savedSearch.match").'
          },
          filters: {
            type: 'object',
            description: 'Optional filters for the webhook events.'
          }
        },
        required: ['url', 'event']
      }
    }
  }
}

export { apiTool }
