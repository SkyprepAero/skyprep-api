# MongoDB Setup Guide

Your application is configured but **MongoDB is not running**. Here's how to fix it:

## ⚠️ Current Error

```
Error: connect ECONNREFUSED ::1:27017
MongoDB Connection Error: connect ECONNREFUSED 127.0.0.1:27017
Make sure MongoDB is running on your system
```

This means MongoDB is not started on your machine.

---

## 🔧 Quick Fix

### Option 1: Install & Start MongoDB Locally (Recommended for Development)

#### Windows

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Choose: Windows, Current Version
   - Download the MSI installer

2. **Install MongoDB**
   - Run the installer
   - Choose "Complete" installation
   - Install as a Windows Service (check the box)
   - Install MongoDB Compass (optional, but helpful)

3. **Start MongoDB Service**
   ```powershell
   # Check if service is running
   Get-Service MongoDB
   
   # Start the service if it's not running
   Start-Service MongoDB
   
   # Or use net command
   net start MongoDB
   ```

4. **Verify MongoDB is Running**
   ```powershell
   # Connect to MongoDB shell
   mongosh
   
   # Or check if port 27017 is listening
   netstat -an | findstr :27017
   ```

#### macOS

```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongosh
```

#### Linux (Ubuntu/Debian)

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
```

---

### Option 2: Use MongoDB Atlas (Cloud - Free Tier Available)

If you don't want to install MongoDB locally, use MongoDB Atlas (cloud database):

1. **Create Free Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create Cluster**
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create Cluster"

3. **Set Up Database Access**
   - Go to "Database Access"
   - Add new database user
   - Choose "Password" authentication
   - Save username and password

4. **Set Up Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development)
   - Confirm

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/`

6. **Update .env File**
   ```env
   MONGODB_URI=mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/skyprep-db?retryWrites=true&w=majority
   ```

---

### Option 3: Use Docker (If you have Docker installed)

```bash
# Pull MongoDB image
docker pull mongo

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo

# Verify
docker ps
```

Your existing `.env` will work with this setup:
```env
MONGODB_URI=mongodb://localhost:27017/skyprep-db
```

---

## ✅ Verify Connection

After starting MongoDB, test your application:

```bash
# Start your Node.js server
npm run dev
```

You should see:
```
MongoDB Connected: localhost (or your connection host)
Database: skyprep-db
Server running in development mode on port 5000
```

---

## 🗄️ MongoDB Compass (GUI Tool)

MongoDB Compass is a GUI tool to view and manage your database:

1. **Download**: https://www.mongodb.com/try/download/compass
2. **Install** and open
3. **Connect** using: `mongodb://localhost:27017`
4. **View** your `skyprep-db` database and collections

---

## 🔍 Common Issues

### Issue: "MongoDB service not found"
**Solution:** MongoDB wasn't installed as a service. Manually start:
```bash
# Navigate to MongoDB bin folder
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Start MongoDB manually
mongod --dbpath "C:\data\db"
```

### Issue: "Access denied" when starting service
**Solution:** Run PowerShell/Command Prompt as Administrator

### Issue: "Port 27017 already in use"
**Solution:** Another process is using the port
```bash
# Windows - Find process using port 27017
netstat -ano | findstr :27017

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Issue: Connection string doesn't work
**Solution:** Check your `.env` file:
- No spaces around `=`
- Correct format: `MONGODB_URI=mongodb://localhost:27017/skyprep-db`
- Restart your Node.js server after changing `.env`

---

## 📚 Next Steps

Once MongoDB is running:

1. **Test API endpoints** using Swagger at http://localhost:5000/api-docs
2. **Register a user** via POST `/api/v1/auth/register`
3. **View data** in MongoDB Compass
4. **Check collections** - You should see a `users` collection after creating a user

---

## 💡 Tips

- **Auto-start**: Set MongoDB to start automatically on system boot
- **Backup**: Regular backups are important (use `mongodump`)
- **Security**: In production, use authentication and secure connections
- **Performance**: Add indexes for frequently queried fields

---

## 🆘 Still Having Issues?

Check the MongoDB logs:

**Windows:**
```
C:\Program Files\MongoDB\Server\7.0\log\mongod.log
```

**macOS/Linux:**
```
/usr/local/var/log/mongodb/mongo.log
```

Or visit MongoDB documentation: https://docs.mongodb.com/manual/installation/






