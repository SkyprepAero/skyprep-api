const Joi = require('joi');

// Subject validation schemas
const createSubjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Subject name is required',
      'string.min': 'Subject name must be at least 1 character long',
      'string.max': 'Subject name cannot exceed 100 characters',
      'any.required': 'Subject name is required'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    })
});

const updateSubjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Subject name cannot be empty',
      'string.min': 'Subject name must be at least 1 character long',
      'string.max': 'Subject name cannot exceed 100 characters'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  isActive: Joi.boolean()
    .optional()
});

const getSubjectsSchema = Joi.object({
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
  isActive: Joi.boolean()
    .optional()
});

const getSubjectByIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid subject ID format',
      'any.required': 'Subject ID is required'
    })
});

module.exports = {
  createSubjectSchema,
  updateSubjectSchema,
  getSubjectsSchema,
  getSubjectByIdSchema
};
