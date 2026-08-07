import * as Joi from 'joi';
import { Environment } from '@common/enums/environment.enum';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().required().default(3000).messages({
    'number.base': 'PORT must be a number',
    'any.required': 'PORT is required',
  }),

  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .required()
    .messages({
      'any.only': 'NODE_ENV must be one of development, production, test',
      'any.required': 'NODE_ENV is required',
    }),

  APP_NAME: Joi.string().required().messages({
    'any.required': 'APP_NAME is required',
  }),

  SLACK_WEBHOOK_URL: Joi.string().uri().required().messages({
    'string.uri': 'SLACK_WEBHOOK_URL must be a valid URL',
    'any.required': 'SLACK_WEBHOOK_URL is required',
  }),

  // MONGO_URI: Joi.string().required(),

  // JWT_SECRET: Joi.string().required(),
});
