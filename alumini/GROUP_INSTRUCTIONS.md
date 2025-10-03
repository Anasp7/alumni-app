# Alumni Connect - Group Project Instructions

## 🚀 Quick Start (One Command Setup)

### Prerequisites
- Docker Desktop installed and running
- Git installed

### Setup Steps
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd alumini
   ```

2. **Start the entire application:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api/health

4. **Stop the application:**
   ```bash
   docker compose down
   ```

## 🔐 Demo Accounts

### Alumni Account
- **Email:** alice@alumni.edu
- **Password:** password123
- **Role:** Alumni (can post opportunities, mentor students)

### Student Account
- **Email:** sarah@student.edu
- **Password:** password123
- **Role:** Student (can apply for jobs, request mentorship)

## 📋 Features Overview

### ✅ Completed Features
1. **User Authentication**
   - JWT-based login system
   - Role-based access (Alumni/Student)
   - Secure password hashing

2. **Dashboard**
   - Real-time backend health monitoring
   - Platform statistics
   - Recent opportunities and stories
   - Quick action buttons

3. **Job Opportunities**
   - Browse job/internship postings
   - Filter by type (full-time, part-time, internship, contract)
   - Apply for positions (students only)
   - Detailed job descriptions and requirements

4. **Mentorship System**
   - Request mentorship from alumni
   - View mentorship requests
   - Status tracking

5. **Success Stories**
   - Share and read success stories
   - Alumni experiences and career journeys

6. **Backend API**
   - RESTful API with comprehensive endpoints
   - MySQL database with proper schema
   - JWT authentication middleware
   - Role-based access control

## 🛠️ Development Guide

### Project Structure
```
alumini/
├── docker-compose.yml          # Main orchestration file
├── .env                        # Environment variables
├── db/
│   └── init.sql               # Database schema and demo data
├── new-backend/               # Flask backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── config.py
│       └── routes/            # API endpoints
└── new-frontend/              # React frontend
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.jsx
        └── pages/             # React components
```

### Adding New Features

#### Backend (Flask)
1. **Create new route file** in `new-backend/app/routes/`
2. **Register blueprint** in `new-backend/app/__init__.py`
3. **Add database tables** in `db/init.sql` if needed
4. **Test API endpoints** using http://localhost:5000/api/

#### Frontend (React)
1. **Create new page** in `new-frontend/src/pages/`
2. **Add route** in `new-frontend/src/App.jsx`
3. **Add navigation link** in the main navigation
4. **Test UI** at http://localhost:5173

### Database Management
- **View data:** Connect to MySQL on port 3307
- **Reset data:** Run `docker compose down -v && docker compose up --build`
- **Add demo data:** Edit `db/init.sql`

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:**
   - MySQL uses port 3307 (not 3306)
   - Frontend uses port 5173
   - Backend uses port 5000

2. **Docker not starting:**
   - Ensure Docker Desktop is running
   - Check if ports are available
   - Try `docker compose down` then `docker compose up --build`

3. **Login issues:**
   - Use demo accounts: alice@alumni.edu / password123
   - Check browser console for errors
   - Verify backend is running at http://localhost:5000/api/health

4. **Database connection:**
   - Wait for database to initialize (30-60 seconds)
   - Check `docker compose logs db` for errors

### Useful Commands
```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Rebuild specific service
docker compose up --build backend

# Clean restart
docker compose down -v
docker compose up --build
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users` - List all users
- `GET /api/users/alumni` - List alumni
- `GET /api/users/students` - List students
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user profile

### Opportunities
- `GET /api/opportunities` - List job opportunities
- `POST /api/opportunities` - Create opportunity (alumni only)
- `GET /api/opportunities/{id}` - Get opportunity details

### Mentorship
- `GET /api/mentorship/requests` - List mentorship requests
- `POST /api/mentorship/requests` - Create request (students only)
- `PUT /api/mentorship/requests/{id}` - Update request status

### Applications
- `POST /api/applications` - Submit application
- `GET /api/applications` - List applications

### Stories
- `GET /api/stories` - List success stories
- `POST /api/stories` - Create story
- `GET /api/stories/{id}` - Get story details

## 🎯 Presentation Tips

### Demo Flow
1. **Start with login** - Show both alumni and student accounts
2. **Dashboard overview** - Explain the platform statistics
3. **Browse opportunities** - Show filtering and application process
4. **Mentorship system** - Demonstrate request creation and management
5. **Success stories** - Show content sharing features
6. **Backend health** - Demonstrate real-time monitoring

### Key Points to Highlight
- **One-command setup** with Docker Compose
- **Role-based access** (Alumni vs Student features)
- **Real-time data** and health monitoring
- **Modern UI/UX** with responsive design
- **Secure authentication** with JWT tokens
- **Comprehensive API** for future extensions

## 🔮 Future Enhancements

### Potential Features
1. **Real-time messaging** between users
2. **Email notifications** for applications and mentorship
3. **Advanced search** with filters and sorting
4. **File uploads** for resumes and documents
5. **Calendar integration** for mentorship sessions
6. **Mobile app** using React Native
7. **Admin dashboard** for platform management
8. **Analytics and reporting** for insights

### Technical Improvements
1. **Unit tests** for backend and frontend
2. **CI/CD pipeline** for automated deployment
3. **Performance optimization** and caching
4. **Security enhancements** (rate limiting, input validation)
5. **Database optimization** with proper indexing
6. **API documentation** with Swagger/OpenAPI

## 📞 Support

### Getting Help
1. **Check logs:** `docker compose logs -f`
2. **Verify setup:** Ensure all prerequisites are met
3. **Test endpoints:** Use http://localhost:5000/api/health
4. **Check browser console** for frontend errors

### Group Collaboration
- **Git workflow:** Use feature branches for new features
- **Code reviews:** Review each other's changes
- **Documentation:** Update this file when adding features
- **Testing:** Test on different machines/environments

---

**Happy coding! 🚀**

*This project demonstrates a full-stack web application with modern technologies, proper architecture, and production-ready features.*
