import Joi from 'joi'

import { validateEmail, validatePhoneSchema } from 'utils/validators'

const schema = Joi.object({
  name: Joi.string().trim().max(70).required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
    'string.max': 'Max field length is 70 chars'
  }),
  email: Joi.string()
    .trim()
    .custom((value, helpers) =>
      !validateEmail(value) ? helpers.error('string.custom') : value
    )
    .required()
    .messages({
      'string.empty': 'Enter valid email',
      'any.required': 'Enter valid email',
      'string.custom': 'Enter valid email'
    }),
  phone: validatePhoneSchema.required().messages({
    'string.empty': 'Incorrect phone format',
    'any.required': 'Incorrect phone format'
  }),
  message: Joi.string().trim().min(10).max(1024).required().messages({
    'string.empty': 'Message is required and should be more than 10 symbols',
    'any.required': 'Message is required and should be more than 10 symbols',
    'string.min': 'Message is required and should be more than 10 symbols',
    'string.max': 'Message is required and should be more than 1024 symbols'
  })
})

export default schema
