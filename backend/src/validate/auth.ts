import joi from 'joi'
import { emailSchema, phoneSchema } from './common.js'
export const userOtpSchema = joi
  .object<UserOtpDto>()
  .keys({
    code: joi.string().length(6).required()
  })
  .required()
  .label('otp')
export const userLoginSchema = joi
  .object<UserLoginDto>()
  .keys({
    email: emailSchema,
    phone: phoneSchema
  })
  .or('email', 'phone')
  .required()
  .label('credentials')
export interface UserLoginDto {
  email?: string
  phone?: string
}
export interface UserOtpDto {
  code: string
}
export const userSignupSchema = joi.object<UserSignupDto>().keys({
  fname: joi.string().required(),
  lname: joi.string().required(),
  email: emailSchema.required(),
  phone: phoneSchema.required(), // Make phone required for all registrations
  referer: joi.string(),
  utmSource: joi.string().allow(''),
  utmMedium: joi.string().allow(''),
  utmCampaign: joi.string().allow(''),
  utmTerm: joi.string().allow(''),
  utmContent: joi.string().allow(''),
  landingPage: joi.string().allow('')
})
export interface UserSignupDto {
  email: string
  fname: string
  lname: string
  phone: string // Make phone required
  referer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  landingPage?: string
}
export const authRepliersTokenSchema = joi.object<AuthRepliersTokenDto>().keys({
  token: joi.string().uuid().required()
})
export interface AuthRepliersTokenDto {
  token: string
}
export const authEmbedSchema = joi.object<AuthEmbedDto>().keys({
  context: joi.string().required(),
  signature: joi.string().required()
})
export interface AuthEmbedDto {
  context: string
  signature: string
}
