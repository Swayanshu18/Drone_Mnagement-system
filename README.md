# Drone Survey Management System

A full-stack web application for managing autonomous drone survey operations across multiple sites. Built for the FlytBase Design Challenge.

![Drone Survey Management](https://img.shields.io/badge/Status-Live-success)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## 🚀 Live Demo

**Application URL:** [Your Hosted URL Here]

**Demo Credentials:**
- Email: `admin@dronesurvey.com`
- Password: `password123`

## 📋 Features

### Mission Planning & Configuration
- Interactive map-based survey area definition (draw polygons)
- Multiple flight patterns: Crosshatch, Perimeter, Grid
- Configurable parameters: altitude, speed, overlap percentage
- Sensor type selection (RGB, Thermal, Multispectral, LiDAR)

### Fleet Management Dashboard
- Real-time drone inventory visualization
- Live status tracking (Available, In-Mission, Maintenance)
- Battery level monitoring with visual indicators
- Add/edit drone capabilities

### Real-time Mission Monitoring
- Live drone position on map
- Mission progress tracking (% complete)
- Status updates via WebSocket
- Mission control actions (Start, Pause, Resume, Abort)

### Survey Reporting & Analytics
- Comprehensive mission statistics
- Status distribution charts
- Monthly mission trends
- Coverage area calculations

### Additional Features
- JWT-based authentication
- Role-based access control (Admin, Operator, Viewer)
- Responsive glassmorphic UI design
- Real-time WebSocket updates

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Leaflet.js with OpenStreetMap (no API key required)
- Recharts for data visualization
- Socket.IO client for real-time updates
- CSS3 with glassmorphic design

### Backend
- Node.js with Express.js
- PostgreSQL database
- Socket.IO for WebSocket communication
- JWT for authentication
- bcrypt for password hashing

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Auth & WebSocket contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── styles/        # Global styles
│   └── index.html
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/        # Database config
│   │   ├── db/            # Migrations & seeds
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── socket/        # WebSocket handlers
│   └── tests/             # Test files
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/drone-survey-management.git
cd drone-survey-management
```

2. **Install dependencies**
```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

3. **Configure environment variables**

Create `server/.env`:
```env
PORT=5001
DATABASE_URL=postgresql://username:password@localhost:5432/drone_survey_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_WS_URL=http://localhost:5001
```

4. **Setup database**
```bash
cd server
npm run migrate
npm run seed
```

5. **Start the application**
```bash
# Terminal 1 - Start server
cd server && npm run dev

# Terminal 2 - Start client
cd client && npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Missions
- `GET /api/missions` - List all missions
- `POST /api/missions` - Create mission
- `GET /api/missions/:id` - Get mission details
- `POST /api/missions/:id/start` - Start mission
- `POST /api/missions/:id/pause` - Pause mission
- `POST /api/missions/:id/abort` - Abort mission

### Drones
- `GET /api/drones` - List all drones
- `POST /api/drones` - Register drone
- `PUT /api/drones/:id` - Update drone

### Reports
- `GET /api/reports/stats` - Get statistics

## 🎨 Design Decisions

### Architecture
- **Separation of Concerns**: Clear separation between frontend, backend, and database layers
- **RESTful API**: Standard REST conventions for predictable API behavior
- **Real-time Updates**: WebSocket for live telemetry and status updates

### Safety Considerations
- **State Machine**: Mission status transitions follow strict rules
- **Drone Availability Check**: Prevents assigning busy drones
- **Role-based Access**: Operators can control, viewers can only observe

### Trade-offs
- **Simulated Telemetry**: Real drone integration would require hardware APIs
- **OpenStreetMap**: Chose over Mapbox for no API key requirement
- **PostgreSQL**: Chose for reliability and JSON support for GeoJSON data

## 🤖 AI Tools Used

This project was developed with assistance from:
- **Kiro IDE** - AI-powered development environment
- **Claude** - Code generation and architecture decisions

AI tools helped with:
- Boilerplate code generation
- CSS styling and responsive design
- Database schema design
- WebSocket implementation patterns

## 📹 Demo Video

[Link to Demo Video]

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 📄 License

This project is created for the FlytBase Design Challenge.
