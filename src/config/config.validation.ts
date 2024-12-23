import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  MONGO_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  TWILIO_ACCOUNT_SID: Joi.string().required(), // Validate Twilio Account SID
  TWILIO_AUTH_TOKEN: Joi.string().required(), // Validate Twilio Auth Token
  TWILIO_VERIFY_SERVICE_SID: Joi.string().required(), // Validate Twilio Verify Service SID
});
