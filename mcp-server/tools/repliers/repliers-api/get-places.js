/**
 * Function to get nearby schools, parks, transit stops, and safety data via the Repliers API.
 *
 * @param {Object} args - Arguments for retrieving places.
 * @param {number} args.lat - Latitude.
 * @param {number} args.long - Longitude.
 * @param {number} [args.radius] - Search radius in kilometers.
 * @param {string} [args.type] - Type of place: "school", "park", "transit", "safety".
 * @returns {Promise<Object>} - The result of retrieving places.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/places`)

    url.searchParams.set('lat', String(args.lat))
    url.searchParams.set('long', String(args.long))
    if (args.radius !== undefined) {
      url.searchParams.set('radius', String(args.radius))
    }
    if (args.type) {
      url.searchParams.set('type', args.type)
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
    console.error('Error retrieving places:', error)
    return {
      error: 'An error occurred while retrieving places.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for retrieving places using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_places',
      description:
        'Get nearby schools, parks, transit stops, and safety data for a given location. Essential for property detail pages and neighborhood guides.',
      parameters: {
        type: 'object',
        properties: {
          lat: {
            type: 'number',
            description: 'Latitude.'
          },
          long: {
            type: 'number',
            description: 'Longitude.'
          },
          radius: {
            type: 'number',
            description: 'Search radius in kilometers.'
          },
          type: {
            type: 'string',
            enum: ['school', 'park', 'transit', 'safety'],
            description: 'Type of place to filter by.'
          }
        },
        required: ['lat', 'long']
      }
    }
  }
}

export { apiTool }
