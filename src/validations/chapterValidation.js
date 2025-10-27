const Joi = require('joi');

// Chapter validation schemas
const createChapterSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Chapter name is required',
      'string.min': 'Chapter name must be at least 1 character long',
      'string.max': 'Chapter name cannot exceed 100 characters',
      'any.required': 'Chapter name is required'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  subject: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid subject ID format',
      'any.required': 'Subject ID is required'
    }),
  order: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.base': 'Order must be a number',
      'number.integer': 'Order must be an integer',
      'number.min': 'Order cannot be negative'
    })
});

const updateChapterSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Chapter name cannot be empty',
      'string.min': 'Chapter name must be at least 1 character long',
      'string.max': 'Chapter name cannot exceed 100 characters'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  subject: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid subject ID format'
    }),
  order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Order must be a number',
      'number.integer': 'Order must be an integer',
      'number.min': 'Order cannot be negative'
    }),
  isActive: Joi.boolean()
    .optional()
});

const getChaptersSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
  search: Joi.string()
    .trim()
    .max(100)
    .optional(),
  subject: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid subject ID format'
    }),
  isActive: Joi.boolean()
    .optional()
});

const getChapterByIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid chapter ID format',
      'any.required': 'Chapter ID is required'
    })
});

const getChaptersBySubjectSchema = Joi.object({
  subjectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid subject ID format',
      'any.required': 'Subject ID is required'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
  isActive: Joi.boolean()
    .optional()
});

module.exports = {
  createChapterSchema,
  updateChapterSchema,
  getChaptersSchema,
  getChapterByIdSchema,
  getChaptersBySubjectSchema
};
