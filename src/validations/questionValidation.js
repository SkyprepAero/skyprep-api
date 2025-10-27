const Joi = require('joi');

// Option validation schema
const optionSchema = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Option text is required',
      'string.min': 'Option text must be at least 1 character long',
      'string.max': 'Option text cannot exceed 500 characters',
      'any.required': 'Option text is required'
    }),
  isCorrect: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Option correctness indicator is required'
    })
});

// Question validation schemas
const createQuestionSchema = Joi.object({
  questionText: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Question text is required',
      'string.min': 'Question text must be at least 1 character long',
      'string.max': 'Question text cannot exceed 1000 characters',
      'any.required': 'Question text is required'
    }),
  options: Joi.array()
    .items(optionSchema)
    .min(2)
    .max(4)
    .required()
    .custom((value, helpers) => {
      // Check if at least one option is marked as correct
      const correctOptions = value.filter(option => option.isCorrect);
      if (correctOptions.length === 0) {
        return helpers.error('custom.atLeastOneCorrect');
      }
      return value;
    })
    .messages({
      'array.min': 'Question must have at least 2 options',
      'array.max': 'Question cannot have more than 4 options',
      'any.required': 'Options are required',
      'custom.atLeastOneCorrect': 'At least one option must be marked as correct'
    }),
  explanation: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Explanation cannot exceed 2000 characters'
    }),
  chapter: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid chapter ID format',
      'any.required': 'Chapter ID is required'
    }),
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard')
    .default('medium')
    .optional()
    .messages({
      'any.only': 'Difficulty must be one of: easy, medium, hard'
    }),
  marks: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(1)
    .optional()
    .messages({
      'number.base': 'Marks must be a number',
      'number.integer': 'Marks must be an integer',
      'number.min': 'Marks must be at least 1',
      'number.max': 'Marks cannot exceed 10'
    })
});

const updateQuestionSchema = Joi.object({
  questionText: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'string.empty': 'Question text cannot be empty',
      'string.min': 'Question text must be at least 1 character long',
      'string.max': 'Question text cannot exceed 1000 characters'
    }),
  options: Joi.array()
    .items(optionSchema)
    .min(2)
    .max(4)
    .optional()
    .custom((value, helpers) => {
      if (value) {
        // Check if at least one option is marked as correct
        const correctOptions = value.filter(option => option.isCorrect);
        if (correctOptions.length === 0) {
          return helpers.error('custom.atLeastOneCorrect');
        }
      }
      return value;
    })
    .messages({
      'array.min': 'Question must have at least 2 options',
      'array.max': 'Question cannot have more than 4 options',
      'custom.atLeastOneCorrect': 'At least one option must be marked as correct'
    }),
  explanation: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Explanation cannot exceed 2000 characters'
    }),
  chapter: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid chapter ID format'
    }),
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard')
    .optional()
    .messages({
      'any.only': 'Difficulty must be one of: easy, medium, hard'
    }),
  marks: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .optional()
    .messages({
      'number.base': 'Marks must be a number',
      'number.integer': 'Marks must be an integer',
      'number.min': 'Marks must be at least 1',
      'number.max': 'Marks cannot exceed 10'
    }),
  isActive: Joi.boolean()
    .optional()
});

const getQuestionsSchema = Joi.object({
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
  chapter: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid chapter ID format'
    }),
  subject: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid subject ID format'
    }),
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard')
    .optional()
    .messages({
      'any.only': 'Difficulty must be one of: easy, medium, hard'
    }),
  isActive: Joi.boolean()
    .optional()
});

const getQuestionByIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid question ID format',
      'any.required': 'Question ID is required'
    })
});

const getQuestionsByChapterSchema = Joi.object({
  chapterId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid chapter ID format',
      'any.required': 'Chapter ID is required'
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
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard')
    .optional()
    .messages({
      'any.only': 'Difficulty must be one of: easy, medium, hard'
    }),
  isActive: Joi.boolean()
    .optional()
});

const getQuestionsBySubjectSchema = Joi.object({
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
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard')
    .optional()
    .messages({
      'any.only': 'Difficulty must be one of: easy, medium, hard'
    }),
  isActive: Joi.boolean()
    .optional()
});

const getQuestionStatsSchema = Joi.object({
  chapter: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid chapter ID format'
    }),
  subject: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid subject ID format'
    })
});

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
  getQuestionsSchema,
  getQuestionByIdSchema,
  getQuestionsByChapterSchema,
  getQuestionsBySubjectSchema,
  getQuestionStatsSchema
};
