# Test Series API Guide

This document provides comprehensive information about the Test Series APIs for managing subjects, chapters, and questions.

## Overview

The Test Series API system consists of three main entities:
- **Subjects**: Top-level categories for organizing content
- **Chapters**: Sub-categories within subjects
- **Questions**: Individual test questions with multiple choice options

## API Endpoints

### Base URL
All test series APIs are available under `/api/` prefix.

### Subjects API

#### Create Subject
```
POST /api/subjects
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

#### Get All Subjects
```
GET /api/subjects?page=1&limit=10&search=math&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by subject name
- `isActive` (optional): Filter by active status

#### Get Subject by ID
```
GET /api/subjects/{id}
```

#### Update Subject
```
PUT /api/subjects/{id}
```

**Request Body:**
```json
{
  "name": "Advanced Mathematics",
  "description": "Advanced mathematical concepts",
  "isActive": true
}
```

#### Delete Subject
```
DELETE /api/subjects/{id}
```

**Note:** Cannot delete subjects that have chapters.

### Chapters API

#### Create Chapter
```
POST /api/chapters
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

#### Get All Chapters
```
GET /api/chapters?page=1&limit=10&subject=60f7b3b3b3b3b3b3b3b3b3b3&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by chapter name
- `subject` (optional): Filter by subject ID
- `isActive` (optional): Filter by active status

#### Get Chapters by Subject
```
GET /api/chapters/subject/{subjectId}?page=1&limit=10&isActive=true
```

#### Get Chapter by ID
```
GET /api/chapters/{id}
```

#### Update Chapter
```
PUT /api/chapters/{id}
```

#### Delete Chapter
```
DELETE /api/chapters/{id}
```

**Note:** Cannot delete chapters that have questions.

### Questions API

#### Create Question
```
POST /api/questions
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

#### Get All Questions
```
GET /api/questions?page=1&limit=10&chapter=60f7b3b3b3b3b3b3b3b3b3b4&difficulty=easy&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by question text
- `chapter` (optional): Filter by chapter ID
- `subject` (optional): Filter by subject ID
- `difficulty` (optional): Filter by difficulty (easy, medium, hard)
- `isActive` (optional): Filter by active status

#### Get Questions by Chapter
```
GET /api/questions/chapter/{chapterId}?page=1&limit=10&difficulty=medium&isActive=true
```

#### Get Questions by Subject
```
GET /api/questions/subject/{subjectId}?page=1&limit=10&difficulty=hard&isActive=true
```

#### Get Question Statistics
```
GET /api/questions/stats?chapter=60f7b3b3b3b3b3b3b3b3b3b4&subject=60f7b3b3b3b3b3b3b3b3b3b3
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

#### Get Question by ID
```
GET /api/questions/{id}
```

#### Update Question
```
PUT /api/questions/{id}
```

#### Delete Question
```
DELETE /api/questions/{id}
```

## Data Models

### Subject Model
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

### Chapter Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String (optional),
  subject: ObjectId (required, ref: 'Subject'),
  order: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Question Model
```javascript
{
  _id: ObjectId,
  questionText: String (required),
  options: [{
    text: String (required),
    isCorrect: Boolean (required)
  }] (2-4 items required),
  correctOptions: [Number] (auto-calculated),
  explanation: String (optional),
  chapter: ObjectId (required, ref: 'Chapter'),
  difficulty: String (enum: ['easy', 'medium', 'hard'], default: 'medium'),
  marks: Number (1-10, default: 1),
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
- `options`: Required array, 2-4 items
  - `text`: Required, 1-500 characters
  - `isCorrect`: Required boolean
- `explanation`: Optional, max 2000 characters
- `chapter`: Required, valid ObjectId
- `difficulty`: Optional, enum ['easy', 'medium', 'hard']
- `marks`: Optional, 1-10 integer

## Error Handling

All APIs return consistent error responses:

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

## Pagination

All list endpoints support pagination:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "itemsPerPage": 10
    }
  }
}
```

## Authentication

**Note:** As requested, these APIs are currently not protected by JWT authentication. They are publicly accessible.

## Usage Examples

### Creating a Complete Test Series

1. **Create Subject:**
```bash
curl -X POST http://localhost:3000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{"name": "Mathematics", "description": "Math concepts"}'
```

2. **Create Chapter:**
```bash
curl -X POST http://localhost:3000/api/chapters \
  -H "Content-Type: application/json" \
  -d '{"name": "Algebra", "subject": "SUBJECT_ID", "order": 1}'
```

3. **Create Question:**
```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Solve: x + 5 = 10",
    "options": [
      {"text": "x = 5", "isCorrect": true},
      {"text": "x = 15", "isCorrect": false},
      {"text": "x = 2", "isCorrect": false}
    ],
    "explanation": "Subtract 5 from both sides",
    "chapter": "CHAPTER_ID",
    "difficulty": "easy"
  }'
```

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

## Future Enhancements

- Add question categories/tags
- Implement question difficulty auto-calculation
- Add question templates
- Support for different question types (multiple choice, true/false, etc.)
- Question import/export functionality
- Bulk operations for questions
