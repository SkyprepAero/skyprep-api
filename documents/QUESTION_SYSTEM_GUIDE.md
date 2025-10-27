# Question System API Guide

This document provides a comprehensive guide to the Question System APIs for managing test series with subjects, chapters, questions, and options.

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Validation Rules](#validation-rules)
6. [Usage Examples](#usage-examples)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## System Overview

The Question System is designed to manage educational content in a hierarchical structure:

```
Subject (1) → (Many) Chapter (1) → (Many) Question (1) → (Many) Option
```

### Key Features
- **Hierarchical Organization**: Subjects contain chapters, chapters contain questions
- **Multiple Choice Questions**: Questions can have 2-4 options with one or more correct answers
- **Flexible Options**: Separate options table for better data management
- **Comprehensive Filtering**: Search and filter by various criteria
- **Pagination Support**: Efficient data retrieval with pagination
- **Validation**: Robust input validation using Joi schemas
- **Statistics**: Detailed analytics and reporting

## Database Schema

### 1. Subject Collection
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String (optional),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Chapter Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String (optional),
  subject: ObjectId (ref: 'Subject', required),
  order: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Question Collection
```javascript
{
  _id: ObjectId,
  questionText: String (required),
  explanation: String (optional),
  chapter: ObjectId (ref: 'Chapter', required),
  difficulty: String (enum: ['easy', 'medium', 'hard'], default: 'medium'),
  marks: Number (1-10, default: 1),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Option Collection
```javascript
{
  _id: ObjectId,
  text: String (required),
  isCorrect: Boolean (required),
  question: ObjectId (ref: 'Question', required),
  order: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Base URL
All APIs are available under `/api/v1/` prefix.

---

## Subject APIs

### Create Subject
```http
POST /api/v1/subjects
```

**Request Body:**
```json
{
  "name": "Mathematics",
  "description": "Mathematical concepts and problems"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Mathematics",
    "description": "Mathematical concepts and problems",
    "isActive": true,
    "createdAt": "2023-07-20T10:30:00.000Z",
    "updatedAt": "2023-07-20T10:30:00.000Z"
  }
}
```

### Get All Subjects
```http
GET /api/v1/subjects?page=1&limit=10&search=math&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by subject name
- `isActive` (optional): Filter by active status

### Get Subject by ID
```http
GET /api/v1/subjects/{id}
```

### Update Subject
```http
PUT /api/v1/subjects/{id}
```

**Request Body:**
```json
{
  "name": "Advanced Mathematics",
  "description": "Advanced mathematical concepts",
  "isActive": true
}
```

### Delete Subject
```http
DELETE /api/v1/subjects/{id}
```

**Note:** Cannot delete subjects that have chapters.

---

## Chapter APIs

### Create Chapter
```http
POST /api/v1/chapters
```

**Request Body:**
```json
{
  "name": "Algebra",
  "description": "Basic algebraic concepts",
  "subject": "60f7b3b3b3b3b3b3b3b3b3b3",
  "order": 1
}
```

### Get All Chapters
```http
GET /api/v1/chapters?page=1&limit=10&subject=60f7b3b3b3b3b3b3b3b3b3b3&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by chapter name
- `subject` (optional): Filter by subject ID
- `isActive` (optional): Filter by active status

### Get Chapters by Subject
```http
GET /api/v1/chapters/subject/{subjectId}?page=1&limit=10&isActive=true
```

### Get Chapter by ID
```http
GET /api/v1/chapters/{id}
```

### Update Chapter
```http
PUT /api/v1/chapters/{id}
```

### Delete Chapter
```http
DELETE /api/v1/chapters/{id}
```

**Note:** Cannot delete chapters that have questions.

---

## Question APIs

### Create Question
```http
POST /api/v1/questions
```

**Request Body:**
```json
{
  "questionText": "What is 2 + 2?",
  "options": [
    {
      "text": "3",
      "isCorrect": false
    },
    {
      "text": "4",
      "isCorrect": true
    },
    {
      "text": "5",
      "isCorrect": false
    }
  ],
  "explanation": "2 + 2 equals 4",
  "chapter": "60f7b3b3b3b3b3b3b3b3b3b4",
  "difficulty": "easy",
  "marks": 1
}
```

### Get All Questions
```http
GET /api/v1/questions?page=1&limit=10&chapter=60f7b3b3b3b3b3b3b3b3b3b4&difficulty=easy&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by question text
- `chapter` (optional): Filter by chapter ID
- `subject` (optional): Filter by subject ID
- `difficulty` (optional): Filter by difficulty (easy, medium, hard)
- `isActive` (optional): Filter by active status

### Get Questions by Chapter
```http
GET /api/v1/questions/chapter/{chapterId}?page=1&limit=10&difficulty=medium&isActive=true
```

### Get Questions by Subject
```http
GET /api/v1/questions/subject/{subjectId}?page=1&limit=10&difficulty=hard&isActive=true
```

### Get Question Statistics
```http
GET /api/v1/questions/stats?chapter=60f7b3b3b3b3b3b3b3b3b3b4&subject=60f7b3b3b3b3b3b3b3b3b3b3
```

**Response:**
```json
{
  "success": true,
  "message": "Question statistics retrieved successfully",
  "data": {
    "totalQuestions": 150,
    "easyQuestions": 50,
    "mediumQuestions": 75,
    "hardQuestions": 25,
    "activeQuestions": 140,
    "totalMarks": 150
  }
}
```

### Get Question by ID
```http
GET /api/v1/questions/{id}
```

### Update Question
```http
PUT /api/v1/questions/{id}
```

### Delete Question
```http
DELETE /api/v1/questions/{id}
```

---

## Option APIs

### Create Options for Question
```http
POST /api/v1/options/question/{questionId}
```

**Request Body:**
```json
{
  "options": [
    {
      "text": "Option 1",
      "isCorrect": true
    },
    {
      "text": "Option 2",
      "isCorrect": false
    },
    {
      "text": "Option 3",
      "isCorrect": false
    }
  ]
}
```

### Get Options for Question
```http
GET /api/v1/options/question/{questionId}
```

### Update Option
```http
PUT /api/v1/options/{optionId}
```

**Request Body:**
```json
{
  "text": "Updated option text",
  "isCorrect": true,
  "order": 1,
  "isActive": true
}
```

### Delete Option
```http
DELETE /api/v1/options/{optionId}
```

### Reorder Options
```http
PUT /api/v1/options/question/{questionId}/reorder
```

**Request Body:**
```json
{
  "optionOrders": [
    {
      "optionId": "60f7b3b3b3b3b3b3b3b3b3b5",
      "order": 0
    },
    {
      "optionId": "60f7b3b3b3b3b3b3b3b3b3b6",
      "order": 1
    }
  ]
}
```

---

## Data Models

### Subject Model
```javascript
{
  _id: ObjectId,
  name: String (required, unique, 1-100 chars),
  description: String (optional, max 500 chars),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Chapter Model
```javascript
{
  _id: ObjectId,
  name: String (required, 1-100 chars),
  description: String (optional, max 500 chars),
  subject: ObjectId (required, ref: 'Subject'),
  order: Number (default: 0, min: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Question Model
```javascript
{
  _id: ObjectId,
  questionText: String (required, 1-1000 chars),
  explanation: String (optional, max 2000 chars),
  chapter: ObjectId (required, ref: 'Chapter'),
  difficulty: String (enum: ['easy', 'medium', 'hard'], default: 'medium'),
  marks: Number (1-10, default: 1),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Option Model
```javascript
{
  _id: ObjectId,
  text: String (required, 1-500 chars),
  isCorrect: Boolean (required),
  question: ObjectId (required, ref: 'Question'),
  order: Number (default: 0, min: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Validation Rules

### Subject Validation
- `name`: Required, 1-100 characters, unique
- `description`: Optional, max 500 characters

### Chapter Validation
- `name`: Required, 1-100 characters, unique within subject
- `description`: Optional, max 500 characters
- `subject`: Required, valid ObjectId
- `order`: Optional, non-negative integer

### Question Validation
- `questionText`: Required, 1-1000 characters
- `explanation`: Optional, max 2000 characters
- `chapter`: Required, valid ObjectId
- `difficulty`: Optional, enum ['easy', 'medium', 'hard']
- `marks`: Optional, 1-10 integer

### Option Validation
- `text`: Required, 1-500 characters
- `isCorrect`: Required boolean
- `question`: Required, valid ObjectId
- `order`: Optional, non-negative integer

## Usage Examples

### Complete Workflow Example

#### 1. Create a Subject
```bash
curl -X POST http://localhost:5000/api/v1/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science",
    "description": "Computer Science fundamentals"
  }'
```

#### 2. Create a Chapter
```bash
curl -X POST http://localhost:5000/api/v1/chapters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Structures",
    "description": "Basic data structures concepts",
    "subject": "SUBJECT_ID_FROM_STEP_1",
    "order": 1
  }'
```

#### 3. Create a Question with Options
```bash
curl -X POST http://localhost:5000/api/v1/questions \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What is the time complexity of binary search?",
    "options": [
      {
        "text": "O(n)",
        "isCorrect": false
      },
      {
        "text": "O(log n)",
        "isCorrect": true
      },
      {
        "text": "O(n²)",
        "isCorrect": false
      }
    ],
    "explanation": "Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.",
    "chapter": "CHAPTER_ID_FROM_STEP_2",
    "difficulty": "medium",
    "marks": 2
  }'
```

#### 4. Get Questions with Statistics
```bash
# Get all questions for a chapter
curl -X GET "http://localhost:5000/api/v1/questions/chapter/CHAPTER_ID?page=1&limit=10"

# Get question statistics
curl -X GET "http://localhost:5000/api/v1/questions/stats?subject=SUBJECT_ID"
```

### Advanced Filtering Examples

#### Search Questions
```bash
# Search by question text
curl -X GET "http://localhost:5000/api/v1/questions?search=binary%20search"

# Filter by difficulty
curl -X GET "http://localhost:5000/api/v1/questions?difficulty=hard"

# Filter by subject
curl -X GET "http://localhost:5000/api/v1/questions?subject=SUBJECT_ID"

# Combined filters
curl -X GET "http://localhost:5000/api/v1/questions?subject=SUBJECT_ID&difficulty=medium&isActive=true&page=1&limit=20"
```

## Error Handling

All APIs return consistent error responses:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ERROR`: Resource already exists
- `DEPENDENCY_ERROR`: Cannot delete due to dependencies
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

## Best Practices

### 1. Data Organization
- Use meaningful subject and chapter names
- Maintain proper order for chapters
- Group related questions in appropriate chapters

### 2. Question Design
- Write clear, unambiguous question text
- Provide helpful explanations
- Use appropriate difficulty levels
- Set reasonable marks based on complexity

### 3. Option Management
- Ensure at least one correct option
- Keep option text concise but clear
- Use consistent ordering
- Avoid trick questions

### 4. Performance
- Use pagination for large datasets
- Filter by specific criteria when possible
- Use indexes for frequently queried fields

### 5. Security
- Validate all input data
- Sanitize user inputs
- Use proper error handling
- Implement rate limiting in production

## Database Indexes

The following indexes are automatically created for optimal performance:

### Subject Indexes
- `name` (unique)
- `isActive`

### Chapter Indexes
- `subject`
- `name`
- `isActive`
- `subject + name` (unique compound)

### Question Indexes
- `chapter`
- `difficulty`
- `isActive`

### Option Indexes
- `question`
- `isCorrect`
- `isActive`
- `question + order` (unique compound)

## API Rate Limits

Currently, there are no rate limits implemented. For production deployment, consider implementing:
- Rate limiting per IP address
- Rate limiting per user/API key
- Different limits for different endpoints

## Future Enhancements

### Planned Features
- Question categories/tags
- Question difficulty auto-calculation
- Question templates
- Bulk operations for questions
- Question import/export functionality
- Advanced analytics and reporting
- Question versioning
- Collaborative question editing
- Question approval workflow

### Additional Question Types
- True/False questions
- Fill-in-the-blank questions
- Matching questions
- Image-based questions
- Audio/Video questions

## Support and Maintenance

### Monitoring
- Monitor API response times
- Track error rates
- Monitor database performance
- Set up alerts for critical issues

### Backup Strategy
- Regular database backups
- Test backup restoration procedures
- Document recovery processes

### Updates
- Keep dependencies updated
- Test changes in staging environment
- Maintain backward compatibility
- Document breaking changes

---

This comprehensive guide covers all aspects of the Question System API. For additional support or questions, please refer to the main API documentation or contact the development team.
