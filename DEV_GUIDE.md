# Development Guide

Quick reference for developing with SkyPrep API.

## 🚀 Getting Started

### First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` (if needed)
   - Update MongoDB connection string
   - Set JWT secret

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 📝 Development Commands

### Start Development Server
```bash
npm run dev
```
- Uses **nodemon** for auto-restart
- Watches `src/` folder for changes
- Automatically reloads on file save
- Perfect for active development

### Start Production Server
```bash
npm start
```
- Standard Node.js execution
- No auto-restart
- Use for production deployment

### Run Tests (when implemented)
```bash
npm test
```

## 🔄 Nodemon Configuration

Configuration in `nodemon.json`:

```json
{
  "watch": ["src"],           // Watch src folder
  "ext": "js,json",           // Watch .js and .json files
  "ignore": ["*.test.js"],    // Ignore test files
  "delay": 1000               // Wait 1s before restart
}
```

### What Triggers Auto-Restart?

✅ Changes to any `.js` file in `src/`
✅ Changes to any `.json` file in `src/`
✅ Changes to routes, controllers, models
✅ Changes to middleware, utils, config

❌ Changes to `node_modules/`
❌ Changes to `.env` file (restart manually)
❌ Changes to test files

## 🛠️ Development Workflow

### 1. Start the Dev Server
```bash
npm run dev
```

You should see:
```
[nodemon] starting `node src/server.js`
Server running in development mode on port 5000
API Version: v1
Server URL: http://localhost:5000
MongoDB Connected: ...
Database: skyprep-db
```

### 2. Make Changes
- Edit any file in `src/`
- Save the file
- Nodemon automatically restarts

You'll see:
```
[nodemon] restarting due to changes...
[nodemon] starting `node src/server.js`
```

### 3. Test Your Changes
- Use Swagger UI: http://localhost:5000/api-docs
- Use cURL, Postman, or your frontend
- Check terminal logs for errors

## 📂 Project Structure for Development

```
src/
├── config/          # App configuration
├── controllers/     # Business logic (modify often)
├── models/          # Database schemas
├── routes/          # API endpoints (modify often)
├── middleware/      # Custom middleware
├── validations/     # Input validation
├── utils/           # Helper functions
├── errors/          # Error handling
└── server.js        # Entry point
```

## 🔍 Debugging Tips

### 1. Check Server Logs
Watch the terminal where `npm run dev` is running:
```
Server running in development mode on port 5000
MongoDB Connected: ...
```

### 2. Use Console.log
Add debug logs in your code:
```javascript
console.log('Debug:', variableName);
```

### 3. Check MongoDB Connection
```bash
# Verify .env has correct MONGODB_URI
type .env
```

### 4. Test Endpoints
```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/
```

## 🐛 Common Issues

### Issue: Nodemon not restarting
**Solution:** 
- Check `nodemon.json` configuration
- Ensure you're editing files in `src/` folder
- Try manually restarting: `rs` + Enter in terminal

### Issue: Port already in use
**Solution:**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### Issue: MongoDB connection error
**Solution:**
- Check MongoDB Atlas connection string
- Verify internet connection
- Check IP whitelist in MongoDB Atlas

### Issue: Changes not reflecting
**Solution:**
- Make sure you saved the file
- Check terminal for restart message
- Clear browser cache if testing frontend
- Try manual restart: `rs` + Enter

## ⚡ Quick Tips

### Manually Restart Nodemon
Type `rs` + Enter in the terminal running nodemon

### Stop the Server
Press `Ctrl + C` in the terminal

### View All Routes
```bash
curl http://localhost:5000/api/v1
```

### Test Auth Endpoints
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dev User","email":"dev@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@test.com","password":"test123"}'
```

### View Swagger Docs
Open browser: http://localhost:5000/api-docs

## 📊 Development Tools

### VS Code Extensions (Recommended)
- **REST Client** - Test API in VS Code
- **MongoDB for VS Code** - Browse database
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Thunder Client** - API testing

### Browser Tools
- **Swagger UI** - http://localhost:5000/api-docs
- **MongoDB Compass** - GUI for MongoDB

### Command Line Tools
- **cURL** - Test endpoints
- **Postman** - API testing
- **mongosh** - MongoDB shell

## 🎯 Best Practices

1. **Always use `npm run dev` during development**
   - Faster iteration
   - Catches errors immediately
   - No need to manually restart

2. **Watch the terminal logs**
   - See when server restarts
   - Catch errors early
   - Monitor MongoDB queries

3. **Use Swagger for testing**
   - Interactive API documentation
   - Test all endpoints
   - See request/response examples

4. **Make small, incremental changes**
   - Test after each change
   - Easier to debug
   - Faster development

5. **Keep .env file updated**
   - Don't commit `.env` to git
   - Use `.env.example` as template
   - Restart server after .env changes

## 🔥 Hot Reload Workflow

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Test endpoints
curl http://localhost:5000/health

# Edit a file in src/
# Save
# Server auto-restarts
# Test again - changes applied!
```

## 📚 Additional Resources

- **Main README:** `README.md`
- **API Documentation:** `documents/API_DOCUMENTATION.md`
- **Newsletter Guide:** `documents/NEWSLETTER_GUIDE.md`
- **Project Structure:** `PROJECT_STRUCTURE.md`
- **MongoDB Setup:** `MONGODB_SETUP.md`

## 💡 Pro Tips

1. Keep multiple terminal windows open:
   - Terminal 1: `npm run dev` (server)
   - Terminal 2: Testing commands
   - Terminal 3: Git operations

2. Use Swagger UI for quick testing:
   - No need to write cURL commands
   - Interactive interface
   - Save time

3. Check MongoDB Compass:
   - See data changes in real-time
   - Debug database queries
   - Verify data integrity

4. Use environment variables:
   - Never hardcode sensitive data
   - Easy to change configurations
   - Production-ready code

---

Happy coding! 🚀






