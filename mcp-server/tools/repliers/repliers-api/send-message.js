/**
 * Function to send a message to a client via the Repliers API.
 *
 * @param {Object} args - Arguments for sending the message.
 * @param {string} args.clientId - Client ID.
 * @param {string} args.agentId - Agent ID.
 * @param {string} args.message - Message body.
 * @param {string} [args.mlsNumber] - Optional MLS number for context.
 * @param {string} [args.type] - Message type: "email" or "sms".
 * @returns {Promise<Object>} - The result of sending the message.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/messages`)

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
    console.error('Error sending message:', error)
    return {
      error: 'An error occurred while sending the message.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for sending a message using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'send_message',
      description:
        'Send a message to a client via the Repliers 2-way messaging system. Can be used for listing updates, market insights, or direct communication.',
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'Client ID.'
          },
          agentId: {
            type: 'string',
            description: 'Agent ID.'
          },
          message: {
            type: 'string',
            description: 'Message body.'
          },
          mlsNumber: {
            type: 'string',
            description: 'Optional MLS number for context.'
          },
          type: {
            type: 'string',
            enum: ['email', 'sms'],
            description: 'Message type: "email" or "sms".'
          }
        },
        required: ['clientId', 'agentId', 'message']
      }
    }
  }
}

export { apiTool }
