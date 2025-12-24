# 🚁 Drone Survey Management System

A comprehensive full-stack web application for planning, managing, and monitoring autonomous drone survey operations with **real-time flight simulation**, **intelligent battery management**, and **5 advanced flight patterns**. Built for the FlytBase Design Challenge.

![Drone Survey Management](https://img.shields.io/badge/Status-Live-success)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange)
![Flight Simulation](https://img.shields.io/badge/Flight-Simulation-purple)

## 🚀 Live Demo

**Frontend URL:** `https://drone-mnagement-system-tlfg-9wav36zls-swayanshu-routs-projects.vercel.app/`

**Backend API:** `https://drone-mnagement-system.onrender.com`

**Demo Credentials:**
- Email: `admin@dronesurvey.com`
- Password: `password123`

> Note: Backend may take 30-60 seconds to wake up on first request (Render free tier)

---

## 🎯 Key Features

### ✨ **Real-Time Flight Simulation** (NEW!)
- **20Hz physics engine** with realistic drone dynamics
- **Smooth animations** - Drone moves along path with propeller effects
- **Live telemetry** - Altitude, speed, heading, distance updated 20x/second
- **Animated progress** - Real-time mission completion tracking
- **Visual feedback** - Completed path trail, status indicators, battery warnings

### 🗺️ **5 Advanced Flight Patterns** (NEW!)
1. **Grid** 📐 - Horizontal lawn-mower pattern for standard surveys
2. **Crosshatch** ✖️ - Horizontal + vertical passes for 3D modeling (double coverage)
3. **Perimeter** 🔲 - Boundary-only flight for quick edge surveys
4. **Hatch** ⬔ - Diagonal pattern at 45° for terrain analysis
5. **Waypoint** 📍 - Direct point-to-point navigation

**Pattern Selection:**
- Real-time pattern switching before flight
- Visual preview on map
- Automatic waypoint generation (40-120 points depending on pattern)
- Pattern-specific descriptions and use cases

### 🔋 **Intelligent Battery Management** (NEW!)
- **Realistic drain simulation** - 0.05-0.15% per second based on speed
- **Automatic RTH** - Returns home at 20% battery
- **Visual warnings** - Yellow (20%), Red (10%), Critical (0%)
- **Auto-charging** - 2% per second charging after landing
- **Status indicators** - Normal, Low Battery, Charging, Ready
- **Battery bar** - Color-coded with animated shine effect

### 🎮 **Mission Control** (NEW!)
- **Start/Pause/Resume/Abort** - Full mission control
- **Speed control** - Adjustable 2-20 m/s with presets (Slow/Normal/Fast)
- **RTH trigger** - Manual return-to-home command
- **Real-time ETA** - Estimated time remaining updates
- **Mission states** - PLANNED → IN_PROGRESS → PAUSED → COMPLETED/ABORTED

### 📊 **Live Telemetry Dashboard** (NEW!)
- **Altitude** - Real-time height above ground
- **Speed** - Current velocity in m/s
- **Heading** - Compass direction (0-360°)
- **Distance** - Total distance traveled in km
- **Battery** - Percentage with drain rate
- **Progress** - Mission completion percentage

### 🎨 **Modern UI Design** (NEW!)
- **Gradient backgrounds** - Purple/blue theme with animated effects
- **Glassmorphism cards** - Frosted glass effect with backdrop blur
- **Smooth animations** - Hover effects, ripples, glows, pulses
- **Responsive design** - Works on desktop, tablet, mobile
- **Custom scrollbar** - Gradient styled scrollbar
- **Status badges** - Gradient badges with pulse animations

### ✅ Mission Planning & Configuration
- Interactive map-based survey area definition using polygon drawing
- Configurable parameters: altitude (10-120m), speed (1-20 m/s), overlap (30-90%)
- Sensor type selection: RGB, Thermal, Multispectral, LiDAR
- Automatic flight path generation with 40-120 waypoints
- Estimated duration and coverage area calculation
- Mission type descriptions and recommendations

### ✅ Fleet Management Dashboard
- Organization-wide drone inventory visualization
- Real-time status tracking (Available, In-Mission, Maintenance, Offline)
- Battery level monitoring with visual indicators
- Drone specifications display (max flight time, speed, sensors)
- Add/Edit drone capabilities
- Drone assignment to missions

### ✅ Survey Reporting & Analytics
- Comprehensive mission statistics dashboard
- Status distribution pie charts
- Monthly mission trend line charts
- Total coverage area calculations
- Flight hours tracking
- Mission history and logs

### ✅ Authentication & Security
- JWT-based authentication system
- Role-based access control (Admin, Operator, Viewer)
- Secure password hashing with bcrypt
- Protected routes and API endpoints
- Session management
- User management interface

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| React 18 | UI component library | 18.2.0 |
| Vite | Build tool and dev server | 4.4.5 |
| Leaflet.js | Interactive map rendering | 1.9.4 |
| OpenStreetMap | Map tiles (no API key required) | - |
| Recharts | Data visualization | 2.8.0 |
| Socket.IO Client | Real-time communication | 4.7.2 |
| Axios | HTTP client | 1.5.0 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js 18 | JavaScript runtime | 18+ |
| Express.js | Web framework | 4.18.2 |
| PostgreSQL | Relational database | 15+ |
| Socket.IO | WebSocket server | 4.7.2 |
| JWT | Authentication | jsonwebtoken 9.0.2 |
| bcryptjs | Password hashing | 2.4.3 |
| @turf/turf | Geospatial calculations | 6.5.0 |

### Simulation Engine (NEW!)
| Component | Purpose | Technology |
|-----------|---------|------------|
| FlightDynamics | Physics simulation | Custom JavaScript |
| PathStrategies | Flight path generation | Turf.js + Custom algorithms |
| Battery System | Power management | Custom drain/charge model |
| Telemetry | Real-time data streaming | Socket.IO (20Hz) |

### Deployment
| Service | Purpose | URL |
|---------|---------|-----|
| Vercel | Frontend hosting | https://drone-mnagement-system-tlfg-9wav36zls-swayanshu-routs-projects.vercel.app/ |
| Render | Backend hosting | https://drone-mnagement-system.onrender.com |
| Render PostgreSQL | Database hosting | Managed PostgreSQL |

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
│   │   ├── hooks/             # useFlightSimulation (NEW!)
│   │   ├── services/          
│   │   │   ├── api.js         # API service
│   │   │   └── flightSimulation/  # FlightPathGenerator, FlightSimulationEngine (NEW!)
│   │   └── styles/            # Global CSS + Modern UI
│   └── index.html
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── db/                # Migrations and seeds
│   │   ├── middleware/        # Auth, error handling
│   │   ├── models/            # Data access layer
│   │   ├── routes/            # API endpoints
│   │   ├── services/          
│   │   │   ├── simulationService.js  # Mission simulation (NEW!)
│   │   │   └── simulation/    
│   │   │       ├── FlightDynamics.js    # Physics engine (NEW!)
│   │   │       └── PathStrategies.js    # Path generation (NEW!)
│   │   └── socket/            # WebSocket handlers
│   └── tests/                 # Test files
├── DOCUMENTATION.md           # Detailed technical documentation
├── ANIMATION_FIX.md          # Flight animation implementation (NEW!)
├── BATTERY_SYSTEM_EXPLAINED.md  # Battery system details (NEW!)
├── FLIGHT_PATTERNS.md        # Flight pattern guide (NEW!)
├── PATTERN_SELECTION_FIX.md  # Pattern selection implementation (NEW!)
├── UI_ENHANCEMENTS.md        # Modern UI design details (NEW!)
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
| PUT | `/api/missions/:id` | Update mission |
| POST | `/api/missions/:id/assign-drone` | Assign drone to mission |

### Drones
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drones` | List all drones |
| POST | `/api/drones` | Register new drone |
| PUT | `/api/drones/:id` | Update drone |
| GET | `/api/drones/:id` | Get drone details |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/stats` | Get statistics |
| GET | `/api/reports` | List all reports |

### WebSocket Events (NEW!)

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `simulation:start` | `{ missionId, flightPattern }` | Start mission simulation |
| `simulation:pause` | `missionId` | Pause simulation |
| `simulation:resume` | `missionId` | Resume simulation |
| `simulation:stop` | `missionId` | Stop/abort simulation |
| `simulation:setSpeed` | `{ missionId, speed }` | Change flight speed |
| `simulation:rth` | `missionId` | Trigger return-to-home |
| `drone:subscribe` | `droneId` | Subscribe to drone telemetry |
| `mission:subscribe` | `missionId` | Subscribe to mission updates |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `telemetry:update` | `{ droneId, latitude, longitude, altitude, speed, battery, heading, state }` | Real-time telemetry (20Hz) |
| `mission:status` | `{ missionId, status, flightPath }` | Mission status change |
| `mission:progress` | `{ missionId, percentage, eta }` | Progress update |

---

## 🎨 Design Decisions

### Architecture Choices

1. **Real-Time Flight Simulation** (NEW!)
   - **20Hz physics engine** for smooth animations
   - **WebSocket-based telemetry** for low latency
   - **Client-side rendering** with server-side physics
   - **Optimized for 60fps** UI updates

2. **5 Flight Pattern Algorithms** (NEW!)
   - **Grid**: Lawn-mower pattern with alternating directions
   - **Crosshatch**: Double coverage (horizontal + vertical)
   - **Perimeter**: Boundary following with spiral option
   - **Hatch**: Diagonal pattern at 45° angle
   - **Waypoint**: Direct point-to-point navigation
   - **Turf.js** for geospatial calculations

3. **Battery Management System** (NEW!)
   - **Realistic drain model**: Speed-based consumption
   - **Automatic safety**: RTH at 20% battery
   - **Charging simulation**: 2% per second recharge
   - **Visual feedback**: Color-coded warnings

4. **OpenStreetMap over Mapbox**
   - No API key required
   - Free and open-source
   - Sufficient for mission planning visualization
   - Leaflet.js for interactive controls

5. **PostgreSQL over MongoDB**
   - Strong relational model for missions/drones/users
   - Native JSONB support for GeoJSON data
   - ACID compliance for mission-critical operations
   - Better for complex queries and joins

6. **Socket.IO for Real-time**
   - Bidirectional communication for mission control
   - Built-in room support for subscriptions
   - Automatic reconnection handling
   - Fallback to polling if WebSocket unavailable

7. **React Context over Redux**
   - Simpler setup for medium-sized application
   - Sufficient for auth and WebSocket state
   - Less boilerplate code
   - Easier to understand and maintain

### Trade-offs Considered

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Simulated telemetry | Demonstrates all features without hardware | Not real hardware integration |
| 20Hz update rate | Smooth animations, low latency | Higher network bandwidth usage |
| Client-side path preview | Instant feedback, no server load | Duplicate logic (client + server) |
| JWT in localStorage | Simple implementation | Less secure than httpOnly cookies |
| Single database | Simpler deployment | May need sharding at scale |
| Gradient UI | Modern, attractive design | May not work on older browsers |

---

## 🔒 Safety & Adaptability

### Safety Features
- **Mission state machine** prevents invalid transitions
- **Drone availability validation** before mission start
- **Battery level checks** with automatic RTH at 20%
- **Low battery warnings** at 20% (yellow) and 10% (red)
- **Automatic landing** when battery reaches critical level
- **Role-based access control** (Admin, Operator, Viewer)
- **Mission abort capability** for emergency situations
- **Real-time status monitoring** with WebSocket updates

### Adaptability
- **Modular service architecture** - Easy to add new features
- **Configurable flight parameters** - Altitude, speed, overlap
- **Extensible sensor types** - RGB, Thermal, Multispectral, LiDAR
- **JSONB fields** for flexible data storage
- **Plugin-based flight patterns** - Easy to add new patterns
- **Customizable battery models** - Adjust drain/charge rates
- **Scalable WebSocket rooms** - Support for multiple concurrent missions
- **Environment-based configuration** - Different settings for dev/prod

### Performance Optimizations (NEW!)
- **20Hz telemetry** for smooth real-time updates
- **GPU-accelerated CSS animations** for 60fps UI
- **Efficient path algorithms** using Turf.js
- **WebSocket connection pooling** for multiple drones
- **Lazy loading** for map tiles and components
- **Debounced user inputs** for better UX
- **Optimized database queries** with proper indexing

---

## 🤖 AI Tools Used

This project was developed with assistance from:
- **Kiro IDE** - AI-powered development environment
- **Claude AI (Anthropic)** - Code generation, architecture decisions, and problem-solving

### AI-Assisted Development Areas

**Code Generation:**
- Boilerplate code for React components
- Express.js route handlers and middleware
- Database models and migrations
- WebSocket event handlers
- Flight simulation physics engine
- Path generation algorithms

**Architecture & Design:**
- System architecture decisions
- Database schema design
- WebSocket communication patterns
- State management approach
- Component structure and organization
- API endpoint design

**Styling & UI:**
- Modern gradient-based design system
- Glassmorphism effects with backdrop blur
- CSS animations and transitions
- Responsive layout patterns
- Color scheme and typography
- Accessibility improvements

**Problem Solving:**
- Circular dependency resolution
- WebSocket reconnection handling
- Battery drain calculation algorithms
- Flight path generation logic
- Real-time telemetry optimization
- Browser caching issues

**Documentation:**
- README and technical documentation
- Code comments and JSDoc
- API documentation
- Troubleshooting guides
- Feature explanation documents

### Human Contributions
- Overall project vision and requirements
- Feature prioritization and scope
- Testing and quality assurance
- Deployment configuration
- Bug identification and reporting
- User experience feedback

**AI Productivity Impact:** ~70% faster development with AI assistance

---

## 📹 Demo Video

[Link to Demo Video - Add your video link here]

---

## 📄 Additional Documentation

### Comprehensive Guides

| Document | Description |
|----------|-------------|
| [DOCUMENTATION.md](./DOCUMENTATION.md) | Complete technical documentation, API reference, database schema |
| [ANIMATION_FIX.md](./ANIMATION_FIX.md) | Flight animation implementation details |
| [BATTERY_SYSTEM_EXPLAINED.md](./BATTERY_SYSTEM_EXPLAINED.md) | Battery drain/charge system with formulas |
| [FLIGHT_PATTERNS.md](./FLIGHT_PATTERNS.md) | All 5 flight patterns explained with diagrams |
| [PATTERN_SELECTION_FIX.md](./PATTERN_SELECTION_FIX.md) | Real-time pattern selection implementation |
| [UI_ENHANCEMENTS.md](./UI_ENHANCEMENTS.md) | Modern UI design system and animations |
| [CIRCULAR_DEPENDENCY_FIX.md](./CIRCULAR_DEPENDENCY_FIX.md) | Architecture improvements |
| [WEBSOCKET_DEBUG.md](./WEBSOCKET_DEBUG.md) | WebSocket troubleshooting guide |
| [START_HERE.md](./START_HERE.md) | Quick start guide for developers |

### Key Features Documentation

**Flight Simulation:**
- Physics engine running at 20Hz
- Realistic acceleration/deceleration
- Heading calculation and smooth turns
- Position updates using Haversine formula
- Speed-based battery consumption

**Battery System:**
- Base drain: 0.05% per second
- Speed factor: up to 0.10% per second
- Automatic RTH at 20% battery
- Charging rate: 2% per second
- Visual warnings and status indicators

**Flight Patterns:**
- Grid: 40-60 waypoints, horizontal lines
- Crosshatch: 80-120 waypoints, double coverage
- Perimeter: 4-10 waypoints, boundary only
- Hatch: 60-100 waypoints, diagonal lines
- Waypoint: 4-8 waypoints, direct navigation

**UI Design:**
- Gradient backgrounds with animations
- Glassmorphism cards with backdrop blur
- Smooth hover effects and transitions
- Custom scrollbar styling
- Responsive breakpoints at 900px and 600px

---

## 🎬 Feature Showcase

### Real-Time Flight Simulation
```
🚁 Drone starts at home position
📍 Follows generated flight path (40-120 waypoints)
📊 Telemetry updates 20 times per second
🔋 Battery drains based on speed (0.05-0.15% per second)
⚠️ Automatic RTH at 20% battery
🏠 Returns home and lands automatically
⚡ Charges at 2% per second
✅ Ready for next mission at 100%
```

### Flight Pattern Comparison
```
Pattern      | Waypoints | Coverage | Use Case
-------------|-----------|----------|------------------
Grid         | 40-60     | Single   | Standard surveys
Crosshatch   | 80-120    | Double   | 3D modeling
Perimeter    | 4-10      | Edge     | Boundary surveys
Hatch        | 60-100    | Dense    | Terrain analysis
Waypoint     | 4-8       | Minimal  | Point inspection
```

### Mission Control Flow
```
1. Select mission from list
2. Choose flight pattern (Grid/Crosshatch/Perimeter/Hatch/Waypoint)
3. Adjust speed (2-20 m/s) with presets
4. Click "▶️ Start Mission"
5. Watch real-time:
   - Drone position on map
   - Telemetry (altitude, speed, heading)
   - Battery level with warnings
   - Progress percentage
   - ETA countdown
6. Control options:
   - ⏸️ Pause mission
   - ▶️ Resume mission
   - ⏹️ Abort mission
   - 🏠 Return to home
   - 🎚️ Adjust speed mid-flight
```

### Battery Management Timeline
```
100% → Start mission
 80% → Normal operation (green)
 50% → Caution zone (yellow)
 20% → ⚠️ Low battery warning + Auto RTH
 10% → 🚨 Critical warning (red)
  0% → Landing + Charging starts
 20% → Charging... (blue indicator)
100% → ✅ Ready for next mission
```

---



---

