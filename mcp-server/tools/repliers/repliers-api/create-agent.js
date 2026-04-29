/**
 * Function to create an agent in the Repliers system.
 *
 * @param {Object} args - Arguments for creating the agent.
 * @param {string} args.firstName - Agent's first name.
 * @param {string} args.lastName - Agent's last name.
 * @param {string} args.email - Agent's email address.
 * @param {string} [args.phone] - Agent's phone number.
 * @param {string} [args.brokerageName] - Brokerage name.
 * @returns {Promise<Object>} - The result of creating the agent.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/agents`)

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
    console.error('Error creating the agent:', error)
    return {
      error: 'An error occurred while creating the agent.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for creating an agent using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_agent',
      description:
        'Create an agent in the Repliers system. Required before creating clients, as every client must be associated with an agent.',
      parameters: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            description: "Agent's first name."
          },
          lastName: {
            type: 'string',
            description: "Agent's last name."
          },
          email: {
            type: 'string',
            description: "Agent's email address."
          },
          phone: {
            type: 'string',
            description: "Agent's phone number."
          },
          brokerageName: {
            type: 'string',
            description: 'Brokerage name.'
          }
        },
        required: ['firstName', 'lastName', 'email']
      }
    }
  }
}

export { apiTool }
