# SkyPrep API

A Node.js backend application with MongoDB database.

## Features

- 🚀 RESTful API with Express.js
- 🗄️ MongoDB with Mongoose ODM
- 🔐 JWT Authentication (register, login, protected routes)
- 🛡️ Security with Helmet
- 📝 Request logging with Morgan
- ✅ Input validation with express-validator
- 🔑 Password hashing with bcryptjs
- 🌐 CORS enabled
- 🎯 Role-based authorization (user/admin)
- 🚨 Global error handling
- 📦 Organized folder structure in src/
- 🔧 Utility helpers (error handler, response formatter, constants)
- ♻️ Async error wrapper (no try-catch needed)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository** (if applicable)
   ```bash
   cd skyprep-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   API_VERSION=v1

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/skyprep-db

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # Windows (if MongoDB is installed as a service)
   net start MongoDB

   # Or run mongod directly
   mongod
   ```

## Running the Application

### Development Mode (with auto-restart using nodemon)
```bash
npm run dev
```
✨ **Recommended for development** - Automatically restarts on file changes

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in your .env file).

### What's the Difference?

- **`npm run dev`** - Uses nodemon, watches for file changes, auto-restarts
- **`npm start`** - Standard node execution, no auto-restart (for production)

## API Endpoints

### Health Check
- **GET** `/health` - Check if server is running

### Authentication
- **POST** `/api/v1/auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **POST** `/api/v1/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **GET** `/api/v1/auth/me` - Get current user (Protected)
  - Requires: `Authorization: Bearer <token>`

### Users
- **GET** `/api/v1/users` - Get all users
- **GET** `/api/v1/users/:id` - Get single user
- **POST** `/api/v1/users` - Create new user
- **PUT** `/api/v1/users/:id` - Update user
- **DELETE** `/api/v1/users/:id` - Delete user

## Project Structure

```
skyprep-api/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── userController.js    # User CRUD operations
│   ├── middleware/
│   │   └── auth.js              # Authentication & authorization middleware
│   ├── models/
│   │   └── User.js              # User model schema
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   └── userRoutes.js        # User routes
│   └── server.js                # Application entry point
├── .env                         # Environment variables (create this)
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore file
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## Testing the API

You can test the API using tools like:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [Thunder Client](https://www.thunderclient.com/) (VS Code extension)
- cURL

### Example: Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Example: Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Example: Get Current User (with token)
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Security Features

- **Helmet**: Adds security headers
- **CORS**: Cross-Origin Resource Sharing enabled
- **JWT**: Secure token-based authentication with expiration
- **Password Hashing**: Passwords are hashed using bcryptjs (10 salt rounds)
- **Input Validation**: Comprehensive validation with express-validator
- **Error Handling**: Secure error responses (no sensitive data leakage)
- **Authorization**: Role-based access control middleware
- **Token Verification**: Secure JWT token verification

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| API_VERSION | API version | v1 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/skyprep-db |
| JWT_SECRET | Secret key for JWT | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| CORS_ORIGIN | Allowed CORS origin | * |

## Next Steps

1. Add more models and endpoints as needed
2. Implement more advanced validation
3. Add unit and integration tests
4. Set up error logging (e.g., Winston)
5. Add rate limiting
6. Implement refresh tokens
7. Add email verification
8. Set up CI/CD pipeline

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check if the MONGODB_URI in .env is correct
- Verify MongoDB is accessible on the specified port

### Port Already in Use
- Change the PORT in .env file
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

## License

ISC

