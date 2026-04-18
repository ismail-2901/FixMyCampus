# FixMyCampus - Campus Issue Reporting Platform

A comprehensive web application for students to report and track campus issues anonymously, with real-time group discussions, AI-powered chatbot assistance, and administrative management dashboards.

## 🎯 Features

### For Students
- **Anonymous Issue Reporting** - Report campus problems with complete anonymity (ANON-ID system)
- **Real-time Tracking** - Monitor report status from submission to resolution
- **Group Discussions** - Join anonymous group chats to discuss campus issues and share solutions
- **AI Chatbot** - Ask questions about university programs, facilities, admissions, and platform usage
- **Add Comments** - Add comments to reports and provide feedback
- **Secure Registration** - Password confirmation during registration for added security
- **My Reports** - View all personal submitted reports with admin responses
- **File Attachments** - Attach images and PDF files to reports for detailed documentation

### For Admins
- **Report Management** - Review, respond to, and manage submitted issues
- **Admin Dashboard** - View real-time statistics and detailed issue breakdown by category and status
- **Download Attachments** - Access all student-submitted files and attachments
- **Response Workflow** - Track issue status from pending to resolution with closure confirmation
- **Department Organization** - Manage reports assigned to their department

### For SuperAdmins
- **Full System Control** - Create and manage admin accounts
- **Global Dashboard** - Comprehensive statistics with interactive analytics
- **Category Management** - Configure available issue categories including Transport, Infrastructure, etc.
- **Department Management** - Organize and assign issues by department
- **Group Management** - Create and manage problem-focused discussion groups
- **Analytics & Reports** - View detailed reports on issues by category, department, and status

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI library
- **React Router v6.21.0** - Client-side routing
- **Axios** - HTTP client
- **Chart.js & react-chartjs-2** - Data visualization
- **Socket.io Client** - Real-time messaging

### Backend
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **Socket.io 4.6.2** - Real-time communication
- **MySQL 8.0+** - Database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Helmet** - Security headers
- **Groq API** - AI chatbot integration

## 📋 System Requirements

- **Node.js** v14+ and npm v6+
- **MySQL** 8.0 or higher
- **Windows/Linux/Mac**
- **Modern browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create database
mysql -u root
CREATE DATABASE fixmycampus CHARACTER SET utf8mb4;
EXIT;

# Import schema
mysql -u root fixmycampus < database/schema.sql

# Optional: Load sample data
mysql -u root fixmycampus < database/seed.sql
```

### 2. Backend Setup

```bash
cd server
npm install
npm start
# Backend runs on http://localhost:5002
```

### 3. Frontend Setup

```bash
cd client
npm install
npm start
# Frontend runs on http://localhost:3000
```

### 4. Access Application

Open your browser and go to: **http://localhost:3000**

Register with your university email (@diu.edu.bd), verify it, and start reporting!

## 📁 Project Structure

```
FixMyCampus/
├── server/                    # Backend (Node.js/Express)
│   ├── config/               # Database configuration
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth, uploads
│   ├── routes/               # API endpoints
│   ├── services/             # External services (Groq, Email)
│   ├── sockets/              # Real-time messaging
│   ├── utils/                # Helper functions
│   ├── uploads/              # File storage
│   ├── .env                  # Environment variables
│   ├── package.json          # Dependencies
│   └── server.js             # Entry point
│
├── client/                   # Frontend (React)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # State management
│   │   ├── services/        # API calls
│   │   ├── App.js           # Main app
│   │   └── index.js         # Entry point
│   ├── public/              # Static files
│   └── package.json         # Dependencies
│
└── database/                # Database files
    ├── schema.sql           # Database schema
    └── seed.sql             # Sample data
```

## 🔐 Default Roles

- **Student** - Can report issues and participate in group discussions
- **Staff** - Can manage assigned issues
- **Admin** - Can manage all issues and view analytics
- **SuperAdmin** - Full system control

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/logout` - Logout user

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Submit new report
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report status

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups/:id/join` - Join a discussion group
- `POST /api/groups/:id/leave` - Leave a group
- `GET /api/groups/:id/messages` - Get group messages

### Chatbot
- `POST /api/chatbot/message` - Send message to AI
- `GET /api/chatbot/history` - Get chat history

### Admin
- `GET /api/admin/dashboard` - Admin statistics
- `GET /api/admin/users` - Manage users

### SuperAdmin
- `GET /api/superadmin/dashboard` - System statistics
- `POST /api/superadmin/admins` - Manage admins
- `POST /api/superadmin/groups` - Create groups

## 🔧 Environment Variables

Create `.env` file in server directory:

```
PORT=5002
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fixmycampus

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@fixmycampus.com

# Groq API
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Frontend
CLIENT_URL=http://localhost:3000
```

## 🆕 Latest Updates (Final Version)

### Security & Registration
- ✅ **Password Confirmation** - Students must confirm their password during registration to prevent typos
- ✅ **Removed Test Credentials** - Login page no longer displays test account information for security

### Issue Categories
- ✅ **Transport Category** - New category added for transportation-related issues
- ✅ **Category Ordering** - Categories now display in proper order with "Others" as the last option
- ✅ **Enhanced Queue Ordering** - Backend now sorts categories by ID instead of alphabetically

### File Management
- ✅ **Stable Attachment Links** - Fixed file download URLs to work correctly with backend server (port 5002)
- ✅ **Admin Can Download Files** - Admins can now access all student attachments from the report detail page

### User Experience
- ✅ **Cleaner Interface** - Removed reaction emoji buttons for a more professional experience
- ✅ **Removed Server Terminal Hint** - Cleaned up verification page to only display necessary information

## 📊 Issue Categories

Students can report issues in these categories (in order):
1. **Infrastructure** - Campus facilities and physical infrastructure
2. **Internet Problems** - Network and connectivity issues  
3. **Academic Issue** - Academic-related concerns
4. **Harassment** - Any form of harassment or misconduct
5. **Cleanliness** - Campus cleanliness and sanitation
6. **Security** - Security and safety concerns
7. **Administration** - Administrative processes and policies
8. **Transport** - Transportation and commute issues
9. **Others** - Miscellaneous issues

## 📞 Support & Troubleshooting

### Backend won't start
```bash
# Check if port 5002 is in use
netstat -tuln | grep 5002

# Kill process using port
fuser -k 5002/tcp
```

### MySQL connection error
```bash
# Verify MySQL is running
mysql -u root -e "SELECT 1"

# Check database exists
mysql -u root -e "SHOW DATABASES"
```

### Frontend build issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### File downloads not working
- Ensure backend is running on port 5002
- Check that you're using the latest version with corrected attachment URLs
- Clear browser cache and try again

## 🔄 Migration from Older Versions

If upgrading from an older version:

1. **Database Update:**
   ```sql
   INSERT INTO Categories (name) VALUES ('Transport');
   ```

2. **Backend Update:**
   - The category ordering is now fixed (backend sorts by category_id)
   - Attachment URLs now correctly point to port 5002
   - No breaking changes to existing APIs

3. **Frontend Update:**
   - Remove all cached data: `localStorage.clear()`
   - Refresh browser completely: `Ctrl+Shift+Delete` then `Ctrl+F5`
   - Test login with new password confirmation feature

## 📝 License

This project is for educational purposes at Daffodil International University.

## 👥 Contributors

Developed as part of the DIU Software Development project.

---

**Current Version:** 2.0 (Final)  
**Last Updated:** April 2026  
**Status:** Production Ready ✅

## 📄 License

This project is proprietary software for Daffodil International University.

## 👥 Contributors

Developed for the FixMyCampus initiative at Daffodil International University.

---

**Last Updated:** April 9, 2026  
**Status:** Production Ready ✅
