/**
 * Function to translate a natural language search query into a structured Repliers API request.
 *
 * @param {Object} args - Arguments for the NLP search.
 * @param {string} args.prompt - Natural language search prompt.
 * @param {number} [args.boardId] - MLS board ID.
 * @returns {Promise<Object>} - The result of the NLP search.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/nlp`)

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
    console.error('Error running NLP search:', error)
    return {
      error: 'An error occurred while running the NLP search.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for running an NLP search using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'nlp_search',
      description:
        'Translate a natural language search query into a structured Repliers API request. For example "find me 3 bed homes in Boca Raton under 900k" gets converted to the equivalent API call automatically.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Natural language search prompt.'
          },
          boardId: {
            type: 'number',
            description: 'MLS board ID.'
          }
        },
        required: ['prompt']
      }
    }
  }
}

export { apiTool }
