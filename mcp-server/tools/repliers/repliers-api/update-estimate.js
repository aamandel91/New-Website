/**
 * Function to update an existing property estimate using the Repliers API.
 *
 * @param {Object} args - Arguments for updating the estimate.
 * @param {string} args.estimateId - The estimate ID to update.
 * @param {number} [args.boardId] - MLS board ID.
 * @param {Object} [args.address] - Property address object.
 * @param {string} [args.propertyType] - Property type.
 * @param {string} [args.style] - Property style.
 * @param {number} [args.numBedrooms] - Number of bedrooms.
 * @param {number} [args.numBathrooms] - Number of bathrooms.
 * @param {number} [args.sqft] - Square footage.
 * @param {number} [args.lotSizeInSqft] - Lot size in square feet.
 * @param {number} [args.yearBuilt] - Year built.
 * @param {string} [args.garage] - Garage description.
 * @param {string} [args.pool] - Pool description.
 * @returns {Promise<Object>} - The result of updating the estimate.
 */
const executeFunction = async (args) => {
  const baseUrl = 'https://api.repliers.io'
  const apiKey = process.env.REPLIERS_API_KEY
  let finalUrl

  try {
    const url = new URL(`${baseUrl}/estimates`)

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'REPLIERS-API-KEY': apiKey
    }

    finalUrl = url.toString()

    const response = await fetch(finalUrl, {
      method: 'PUT',
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
    console.error('Error updating the estimate:', error)
    return {
      error: 'An error occurred while updating the estimate.',
      details: error.message,
      url: finalUrl
    }
  }
}

/**
 * Tool configuration for updating a property estimate using the Repliers API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_estimate',
      description:
        'Update an existing property estimate with revised property attributes. Recalculates the AI valuation with the new data. Useful for adjusting a CMA with updated property details.',
      parameters: {
        type: 'object',
        properties: {
          estimateId: {
            type: 'string',
            description: 'The estimate ID to update.'
          },
          boardId: {
            type: 'number',
            description: 'MLS board ID.'
          },
          address: {
            type: 'object',
            properties: {
              streetNumber: {
                type: 'string',
                description: 'Street number.'
              },
              streetName: {
                type: 'string',
                description: 'Street name.'
              },
              city: {
                type: 'string',
                description: 'City name.'
              },
              state: {
                type: 'string',
                description: 'State or province.'
              },
              zip: {
                type: 'string',
                description: 'Postal or zip code.'
              },
              unitNumber: {
                type: 'string',
                description: 'Unit number, if applicable.'
              }
            },
            required: ['streetNumber', 'streetName', 'city', 'zip']
          },
          propertyType: {
            type: 'string',
            description: 'Property type.'
          },
          style: {
            type: 'string',
            description: 'Property style.'
          },
          numBedrooms: {
            type: 'number',
            description: 'Number of bedrooms.'
          },
          numBathrooms: {
            type: 'number',
            description: 'Number of bathrooms.'
          },
          sqft: {
            type: 'number',
            description: 'Square footage.'
          },
          lotSizeInSqft: {
            type: 'number',
            description: 'Lot size in square feet.'
          },
          yearBuilt: {
            type: 'number',
            description: 'Year built.'
          },
          garage: {
            type: 'string',
            description: 'Garage description.'
          },
          pool: {
            type: 'string',
            description: 'Pool description.'
          }
        },
        required: ['estimateId']
      }
    }
  }
}

export { apiTool }
