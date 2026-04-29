/**
 * Function to create a client associated with an agent using the Repliers API.
 *
 * @param {Object} args - Arguments for creating the client.
 * @param {string} args.agentId - Agent ID to associate the client with.
 * @param {string} args.firstName - Client's first name.
 * @param {string} args.lastName - Client's last name.
 * @param {string} args.email - Client's email address.
 * @param {string} [args.phone] - Client's phone number.
 * @returns {Promise<Object>} - The result of creating the client.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/clients`)

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
    console.error('Error creating the client:', error)
    return {
      error: 'An error occurred while creating the client.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for creating a client using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_client',
      description:
        'Create a client associated with an agent. Clients are needed for saved searches, favorites, messaging, and property value update emails.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent ID to associate the client with.'
          },
          firstName: {
            type: 'string',
            description: "Client's first name."
          },
          lastName: {
            type: 'string',
            description: "Client's last name."
          },
          email: {
            type: 'string',
            description: "Client's email address."
          },
          phone: {
            type: 'string',
            description: "Client's phone number."
          }
        },
        required: ['agentId', 'firstName', 'lastName', 'email']
      }
    }
  }
}

export { apiTool }
