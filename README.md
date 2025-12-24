# Drone Survey Management System

A comprehensive full-stack web application for planning, managing, and monitoring autonomous drone survey operations across multiple global sites. Built for the FlytBase Design Challenge.

![Drone Survey Management](https://img.shields.io/badge/Status-Live-success)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## 🚀 Live Demo

**Frontend URL:** `https://drone-mnagement-system-tlfg-9wav36zls-swayanshu-routs-projects.vercel.app/`

**Backend API:** `https://drone-mnagement-system.onrender.com`

**Demo Credentials:**
- Email: `admin@dronesurvey.com`
- Password: `password123`

> Note: Backend may take 30-60 seconds to wake up on first request (Render free tier)

---

## 📋 Features Implemented

### ✅ Mission Planning & Configuration
- Interactive map-based survey area definition using polygon drawing
- Multiple flight patterns: Crosshatch, Perimeter, Grid
- Configurable parameters: altitude (10-120m), speed (1-20 m/s), overlap (30-90%)
- Sensor type selection: RGB, Thermal, Multispectral, LiDAR
- Automatic flight path generation
- Estimated duration and coverage area calculation

### ✅ Fleet Management Dashboard
- Organization-wide drone inventory visualization
- Real-time status tracking (Available, In-Mission, Maintenance, Offline)
- Battery level monitoring with visual indicators
- Drone specifications display (max flight time, speed, sensors)
- Add/Edit drone capabilities

### ✅ Real-time Mission Monitoring
- Live drone position visualization on map
- Mission progress tracking (percentage complete)
- Status updates via WebSocket (starting, in progress, completed, aborted)
- Mission control actions: Start, Pause, Resume, Abort
- Estimated time remaining display

### ✅ Survey Reporting & Analytics
- Comprehensive mission statistics dashboard
- Status distribution pie charts
- Monthly mission trend line charts
- Total coverage area calculations
- Flight hours tracking

### ✅ Additional Features
- JWT-based authentication system
- Role-based access control (Admin, Operator, Viewer)
- Responsive glassmorphic UI design
- Real-time WebSocket updates
- User management interface

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI component library |
| Vite | Build tool and dev server |
| Leaflet.js | Interactive map rendering |
| OpenStreetMap | Map tiles (no API key required) |
| Recharts | Data visualization |
| Socket.IO Client | Real-time communication |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18 | JavaScript runtime |
| Express.js | Web framework |
| PostgreSQL | Relational database |
| Socket.IO | WebSocket server |
| JWT | Authentication |
| bcryptjs | Password hashing |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Render PostgreSQL | Database hosting |

---

## 📁 Project Structure

```
drone-survey-management/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Login, ProtectedRoute
│   │   │   ├── dashboard/     # Layout, Sidebar, Header
│   │   │   ├── fleet/         # FleetDashboard
│   │   │   ├── landing/       # LandingPage
│   │   │   ├── map/           # MapContainer, DrawingTools
│   │   │   ├── missions/      # MissionPlanner, MissionList, MissionMonitor
│   │   │   ├── reports/       # ReportsDashboard
│   │   │   └── users/         # UserManagement
│   │   ├── context/           # AuthContext, WebSocketContext
│   │   ├── services/          # API service
│   │   └── styles/            # Global CSS
│   └── index.html
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── db/                # Migrations and seeds
│   │   ├── middleware/        # Auth, error handling
│   │   ├── models/            # Data access layer
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   └── socket/            # WebSocket handlers
│   └── tests/                 # Test files
├── DOCUMENTATION.md           # Detailed technical documentation
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Local Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd drone-survey-management
```

2. **Install dependencies**
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. **Configure environment variables**

Create `server/.env`:
```env
PORT=5001
DATABASE_URL=postgresql://username:password@localhost:5432/drone_survey_db
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
NODE_ENV=development
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

5. **Start development servers**
```bash
# From root directory
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

### Missions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/missions` | List all missions |
| POST | `/api/missions` | Create new mission |
| GET | `/api/missions/:id` | Get mission details |
| POST | `/api/missions/:id/start` | Start mission |
| POST | `/api/missions/:id/pause` | Pause mission |
| POST | `/api/missions/:id/resume` | Resume mission |
| POST | `/api/missions/:id/abort` | Abort mission |

### Drones
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drones` | List all drones |
| POST | `/api/drones` | Register new drone |
| PUT | `/api/drones/:id` | Update drone |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/stats` | Get statistics |

---

## 🎨 Design Decisions

### Architecture Choices

1. **OpenStreetMap over Mapbox**
   - No API key required
   - Free and open-source
   - Sufficient for mission planning visualization

2. **PostgreSQL over MongoDB**
   - Strong relational model for missions/drones/users
   - Native JSONB support for GeoJSON data
   - ACID compliance for mission-critical operations

3. **Socket.IO for Real-time**
   - Bidirectional communication for mission control
   - Built-in room support for subscriptions
   - Automatic reconnection handling

4. **React Context over Redux**
   - Simpler setup for medium-sized application
   - Sufficient for auth and WebSocket state
   - Less boilerplate code

### Trade-offs Considered

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Simulated telemetry | Demonstrates all features | Not real hardware integration |
| JWT in localStorage | Simple implementation | Less secure than httpOnly cookies |
| Single database | Simpler deployment | May need sharding at scale |

---

## 🔒 Safety & Adaptability

### Safety Features
- Mission state machine prevents invalid transitions
- Drone availability validation before mission start
- Battery level checks
- Role-based access control

### Adaptability
- Modular service architecture
- Configurable flight parameters
- Extensible sensor types
- JSONB fields for flexible data

---

## 🤖 AI Tools Used

This project was developed with assistance from:
- **Kiro IDE** - AI-powered development environment
- **Claude AI** - Code generation and architecture decisions

AI tools helped with:
- Boilerplate code generation
- CSS styling and responsive design
- Database schema design
- WebSocket implementation patterns
- Documentation generation

---

## 📹 Demo Video

[Link to Demo Video - Add your video link here]

---

## 📄 Additional Documentation

For detailed technical documentation including:
- Complete API documentation
- Database schema details
- Component architecture
- Deployment guide

See [DOCUMENTATION.md](./DOCUMENTATION.md)

---

## 📄 License

This project is created for the FlytBase Design Challenge.
