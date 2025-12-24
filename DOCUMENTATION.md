# Drone Survey Management System - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Documentation](#api-documentation)
6. [Frontend Architecture](#frontend-architecture)
7. [Real-time Communication](#real-time-communication)
8. [Authentication & Security](#authentication--security)
9. [Deployment Architecture](#deployment-architecture)
10. [Design Decisions & Trade-offs](#design-decisions--trade-offs)
11. [Safety & Adaptability Strategy](#safety--adaptability-strategy)
12. [AI Tools Usage](#ai-tools-usage)
13. [Future Enhancements](#future-enhancements)

---

## Project Overview

The Drone Survey Management System is a comprehensive full-stack web application designed to enable organizations to plan, manage, and monitor autonomous drone survey operations across multiple global sites. The platform focuses on the critical backbone of drone operations: mission management, real-time monitoring, fleet coordination, and survey reporting.

### Key Capabilities

- **Mission Planning**: Define survey areas using interactive polygon drawing on maps, configure flight patterns (crosshatch, perimeter, grid), set altitude, speed, and sensor parameters
- **Fleet Management**: Organization-wide drone inventory with real-time status tracking, battery monitoring, and maintenance scheduling
- **Real-time Monitoring**: Live drone position visualization, mission progress tracking, and instant status updates via WebSocket
- **Survey Analytics**: Comprehensive reporting dashboard with mission statistics, coverage analysis, and trend visualization

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Auth      │  │  Dashboard  │  │    Map Components       │ │
│  │   Context   │  │   Layout    │  │  (Leaflet/OpenStreetMap)│ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  WebSocket  │  │    API      │  │    State Management     │ │
│  │   Context   │  │   Service   │  │    (React Context)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WSS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Express.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Routes    │  │  Services   │  │      Middleware         │ │
│  │  (REST API) │  │  (Business  │  │  (Auth, Error Handler)  │ │
│  │             │  │   Logic)    │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Models    │  │  Socket.IO  │  │      Database           │ │
│  │  (Data      │  │  (Real-time │  │      Connection         │ │
│  │   Access)   │  │   Events)   │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │  users  │ │ drones  │ │missions │ │  sites  │ │  reports  │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action → React Component → API Service → Express Route → Service Layer → Model → Database
                    ↓                                              ↓
              WebSocket Context ←──────────── Socket.IO ←──────────┘
                    ↓
              UI State Update
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI component library |
| Vite | 5.x | Build tool and dev server |
| Leaflet.js | 1.9.x | Interactive map rendering |
| OpenStreetMap | - | Map tile provider (no API key required) |
| Recharts | 2.x | Data visualization and charts |
| Socket.IO Client | 4.x | Real-time WebSocket communication |
| Axios | 1.x | HTTP client for API requests |
| React Router | 6.x | Client-side routing |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x | JavaScript runtime |
| Express.js | 4.x | Web application framework |
| PostgreSQL | 15.x | Relational database |
| Socket.IO | 4.x | Real-time bidirectional communication |
| JSON Web Token | 9.x | Authentication tokens |
| bcryptjs | 2.x | Password hashing |
| Helmet | 7.x | Security headers |
| CORS | 2.x | Cross-origin resource sharing |

### Development & Deployment

| Tool | Purpose |
|------|---------|
| Git/GitHub | Version control |
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Render PostgreSQL | Database hosting |

---

## Database Design

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │    drones    │       │    sites     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ email        │       │ name         │       │ name         │
│ password     │       │ model        │       │ location     │
│ name         │       │ serial_number│       │ coordinates  │
│ role         │       │ status       │       │ created_at   │
│ created_at   │       │ battery_level│       └──────────────┘
└──────────────┘       │ max_flight_time│            │
       │               │ max_speed    │            │
       │               │ sensors      │            │
       │               │ created_at   │            │
       │               └──────────────┘            │
       │                      │                    │
       │                      │                    │
       ▼                      ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                         missions                             │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ name                                                         │
│ description                                                  │
│ drone_id (FK) ──────────────────────────────────────────────┤
│ site_id (FK) ───────────────────────────────────────────────┤
│ created_by (FK) ────────────────────────────────────────────┤
│ status (planned/in_progress/completed/aborted/paused)       │
│ flight_pattern (crosshatch/perimeter/grid)                  │
│ survey_area (GeoJSON)                                        │
│ flight_path (GeoJSON)                                        │
│ altitude                                                     │
│ speed                                                        │
│ overlap_percentage                                           │
│ sensors                                                      │
│ estimated_duration                                           │
│ actual_duration                                              │
│ coverage_area                                                │
│ progress                                                     │
│ started_at                                                   │
│ completed_at                                                 │
│ created_at                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Table Schemas

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### drones
```sql
CREATE TABLE drones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    serial_number VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in_mission', 'maintenance', 'offline')),
    battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    max_flight_time INTEGER DEFAULT 30,
    max_speed DECIMAL(5,2) DEFAULT 15.0,
    sensors JSONB DEFAULT '["RGB"]',
    last_maintenance TIMESTAMP,
    total_flight_hours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### missions
```sql
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    drone_id UUID REFERENCES drones(id),
    site_id UUID REFERENCES sites(id),
    created_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'planned',
    flight_pattern VARCHAR(50) DEFAULT 'crosshatch',
    survey_area JSONB,
    flight_path JSONB,
    altitude DECIMAL(6,2) DEFAULT 50.0,
    speed DECIMAL(5,2) DEFAULT 10.0,
    overlap_percentage INTEGER DEFAULT 70,
    sensors JSONB DEFAULT '["RGB"]',
    estimated_duration INTEGER,
    actual_duration INTEGER,
    coverage_area DECIMAL(12,2),
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Documentation

### Base URL
- Development: `http://localhost:5001/api`
- Production: `https://drone-mnagement-system.onrender.com/api`

### Authentication Endpoints

#### POST /api/auth/login
Authenticates a user and returns JWT token.

**Request Body:**
```json
{
  "email": "admin@dronesurvey.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@dronesurvey.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### POST /api/auth/register
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "New User",
  "role": "operator"
}
```

### Mission Endpoints

#### GET /api/missions
Retrieves all missions with optional filtering.

**Query Parameters:**
- `status`: Filter by status (planned, in_progress, completed, aborted)
- `drone_id`: Filter by assigned drone
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response (200 OK):**
```json
{
  "missions": [
    {
      "id": "uuid",
      "name": "Site A Survey",
      "status": "planned",
      "drone_id": "uuid",
      "drone_name": "Drone Alpha",
      "progress": 0,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 25
}
```

#### POST /api/missions
Creates a new mission.

**Request Body:**
```json
{
  "name": "Warehouse Inspection",
  "description": "Monthly inspection of warehouse facility",
  "drone_id": "uuid",
  "site_id": "uuid",
  "flight_pattern": "crosshatch",
  "survey_area": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], ...]]
  },
  "altitude": 50,
  "speed": 10,
  "overlap_percentage": 70,
  "sensors": ["RGB", "Thermal"]
}
```

#### POST /api/missions/:id/start
Starts a planned mission.

**Response (200 OK):**
```json
{
  "message": "Mission started successfully",
  "mission": {
    "id": "uuid",
    "status": "in_progress",
    "started_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/missions/:id/pause
Pauses an in-progress mission.

#### POST /api/missions/:id/resume
Resumes a paused mission.

#### POST /api/missions/:id/abort
Aborts a mission and returns drone to base.

### Drone Endpoints

#### GET /api/drones
Retrieves all drones in the fleet.

**Response (200 OK):**
```json
{
  "drones": [
    {
      "id": "uuid",
      "name": "Drone Alpha",
      "model": "DJI Matrice 300",
      "status": "available",
      "battery_level": 95,
      "sensors": ["RGB", "Thermal", "LiDAR"]
    }
  ]
}
```

#### POST /api/drones
Registers a new drone.

#### PUT /api/drones/:id
Updates drone information.

#### PATCH /api/drones/:id/status
Updates drone status.

### Reports Endpoints

#### GET /api/reports/stats
Retrieves organization-wide statistics.

**Response (200 OK):**
```json
{
  "total_missions": 150,
  "completed_missions": 120,
  "total_flight_hours": 450.5,
  "total_coverage_area": 25000.75,
  "active_drones": 8,
  "missions_by_status": {
    "planned": 15,
    "in_progress": 5,
    "completed": 120,
    "aborted": 10
  },
  "missions_by_month": [
    { "month": "2024-01", "count": 25 },
    { "month": "2024-02", "count": 30 }
  ]
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├── AuthContext.Provider
│   └── WebSocketContext.Provider
│       ├── LandingPage
│       ├── LoginForm
│       └── ProtectedRoute
│           └── DashboardLayout
│               ├── Sidebar
│               ├── Header
│               └── Main Content Area
│                   ├── MissionPlanner
│                   │   ├── MapContainer
│                   │   │   └── DrawingTools
│                   │   └── MissionConfigPanel
│                   ├── MissionList
│                   ├── MissionMonitor
│                   │   └── MapContainer (Live View)
│                   ├── FleetDashboard
│                   │   └── DroneCard (multiple)
│                   ├── ReportsDashboard
│                   │   ├── StatisticsCards
│                   │   └── Charts (Recharts)
│                   └── UserManagement
```

### State Management

The application uses React Context API for global state management:

#### AuthContext
- Manages user authentication state
- Stores JWT token in localStorage
- Provides login/logout functions
- Handles token refresh

#### WebSocketContext
- Manages Socket.IO connection
- Provides real-time event subscriptions
- Handles connection/disconnection
- Broadcasts mission updates

### Key Components

#### MapContainer
Interactive map component using Leaflet.js with OpenStreetMap tiles.

**Features:**
- Polygon drawing for survey area definition
- Flight path visualization
- Real-time drone position updates
- Layer controls for different map views

#### MissionPlanner
Comprehensive mission configuration interface.

**Features:**
- Survey area drawing tools
- Flight pattern selection (Crosshatch, Perimeter, Grid)
- Parameter configuration (altitude, speed, overlap)
- Sensor selection
- Estimated duration calculation
- Area coverage calculation

#### MissionMonitor
Real-time mission tracking interface.

**Features:**
- Live drone position on map
- Progress bar with percentage
- Status indicators
- Mission control buttons (Pause, Resume, Abort)
- Telemetry data display

---

## Real-time Communication

### WebSocket Events

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token: string }` | Authenticates WebSocket connection |
| `subscribe:mission` | `{ missionId: string }` | Subscribe to mission updates |
| `unsubscribe:mission` | `{ missionId: string }` | Unsubscribe from mission |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `mission:updated` | `{ mission: Mission }` | Mission status/progress changed |
| `drone:telemetry` | `{ droneId, position, battery, speed }` | Real-time drone telemetry |
| `drone:status` | `{ droneId, status }` | Drone status changed |
| `mission:completed` | `{ missionId, stats }` | Mission completed |

### Implementation Example

```javascript
// Server-side emission
io.to(`mission:${missionId}`).emit('mission:updated', {
  id: missionId,
  progress: 45,
  status: 'in_progress',
  drone_position: { lat: 37.7749, lng: -122.4194 }
});

// Client-side subscription
socket.on('mission:updated', (data) => {
  setMissionProgress(data.progress);
  updateDronePosition(data.drone_position);
});
```

---

## Authentication & Security

### JWT Authentication Flow

```
1. User submits credentials
         │
         ▼
2. Server validates credentials
         │
         ▼
3. Server generates JWT token (24h expiry)
         │
         ▼
4. Client stores token in localStorage
         │
         ▼
5. Client includes token in Authorization header
         │
         ▼
6. Server validates token on each request
         │
         ▼
7. Token refresh before expiry (optional)
```

### Security Measures

1. **Password Hashing**: bcryptjs with salt rounds of 10
2. **JWT Tokens**: Signed with secret key, 24-hour expiration
3. **CORS**: Configured for specific origins only
4. **Helmet**: Security headers (XSS protection, content type sniffing prevention)
5. **Input Validation**: Server-side validation on all inputs
6. **Role-Based Access Control**: Admin, Operator, Viewer roles

### Role Permissions

| Action | Admin | Operator | Viewer |
|--------|-------|----------|--------|
| View Missions | ✓ | ✓ | ✓ |
| Create Missions | ✓ | ✓ | ✗ |
| Start/Stop Missions | ✓ | ✓ | ✗ |
| Manage Drones | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| View Reports | ✓ | ✓ | ✓ |

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│        VERCEL           │  │        RENDER           │
│   (Frontend Hosting)    │  │   (Backend Hosting)     │
├─────────────────────────┤  ├─────────────────────────┤
│ • Static file serving   │  │ • Express.js server     │
│ • CDN distribution      │  │ • Socket.IO server      │
│ • Automatic HTTPS       │  │ • Auto-scaling          │
│ • Preview deployments   │  │ • Health monitoring     │
└─────────────────────────┘  └─────────────────────────┘
                                        │
                                        ▼
                             ┌─────────────────────────┐
                             │   RENDER PostgreSQL     │
                             │   (Database Hosting)    │
                             ├─────────────────────────┤
                             │ • Managed PostgreSQL    │
                             │ • Automatic backups     │
                             │ • SSL connections       │
                             └─────────────────────────┘
```

### Environment Variables

#### Frontend (Vercel)
```
VITE_API_URL=https://drone-mnagement-system.onrender.com/api
VITE_WS_URL=https://drone-mnagement-system.onrender.com
```

#### Backend (Render)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=24h
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app
```

---

## Design Decisions & Trade-offs

### 1. OpenStreetMap vs Mapbox

**Decision**: OpenStreetMap with Leaflet.js

**Rationale**:
- No API key required, reducing deployment complexity
- Free and open-source
- Sufficient for mission planning visualization
- Leaflet provides excellent polygon drawing tools

**Trade-off**: Mapbox offers more advanced features like 3D terrain and satellite imagery, but requires API key management and has usage limits.

### 2. PostgreSQL vs MongoDB

**Decision**: PostgreSQL

**Rationale**:
- Strong relational data model for missions, drones, users
- Native JSON/JSONB support for GeoJSON data
- ACID compliance for mission-critical operations
- Better for complex queries and reporting

**Trade-off**: MongoDB might offer more flexibility for rapidly changing schemas, but our data model is well-defined.

### 3. Socket.IO vs Server-Sent Events

**Decision**: Socket.IO

**Rationale**:
- Bidirectional communication needed for mission control
- Built-in room support for mission subscriptions
- Automatic reconnection handling
- Fallback to polling if WebSocket unavailable

**Trade-off**: SSE would be simpler for one-way updates, but we need bidirectional communication.

### 4. React Context vs Redux

**Decision**: React Context API

**Rationale**:
- Simpler setup for medium-sized application
- Sufficient for auth and WebSocket state
- Less boilerplate code
- Built into React

**Trade-off**: Redux would provide better debugging tools and middleware support for larger applications.

### 5. Simulated Telemetry vs Real Hardware Integration

**Decision**: Simulated telemetry for demonstration

**Rationale**:
- No access to actual drone hardware
- Demonstrates system capabilities effectively
- Allows testing of all UI states
- Realistic simulation of mission progress

**Trade-off**: Real integration would require hardware APIs and physical drones.

---

## Safety & Adaptability Strategy

### Mission Safety Features

1. **State Machine Validation**
   - Missions follow strict status transitions
   - Cannot start mission without assigned drone
   - Cannot assign drone already in mission
   - Automatic status updates on completion/abort

2. **Drone Availability Checks**
   ```javascript
   // Before starting mission
   if (drone.status !== 'available') {
     throw new Error('Drone is not available');
   }
   if (drone.battery_level < 20) {
     throw new Error('Drone battery too low');
   }
   ```

3. **Graceful Degradation**
   - WebSocket disconnection doesn't crash the app
   - Automatic reconnection attempts
   - Fallback to polling if needed

### Adaptability Features

1. **Modular Architecture**
   - Services layer separates business logic
   - Easy to add new flight patterns
   - Sensor types configurable per mission

2. **Configurable Parameters**
   - Flight altitude: 10-120 meters
   - Speed: 1-20 m/s
   - Overlap: 30-90%
   - Multiple sensor combinations

3. **Extensible Database Schema**
   - JSONB fields for flexible data storage
   - Easy to add new drone capabilities
   - Mission metadata extensible

### Error Handling Strategy

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({ error: message });
});
```

---

## AI Tools Usage

### Tools Utilized

1. **Kiro IDE** - AI-powered development environment
2. **Claude AI** - Code generation and architecture assistance

### AI-Assisted Development Areas

| Area | AI Contribution |
|------|-----------------|
| Architecture Design | System component structure, database schema design |
| Boilerplate Code | Express routes, React components, API services |
| CSS Styling | Glassmorphic design, responsive layouts, animations |
| WebSocket Implementation | Socket.IO event handling patterns |
| Error Handling | Comprehensive error middleware |
| Documentation | API documentation, code comments |

### Human-Led Decisions

- Overall system architecture
- Technology stack selection
- Business logic implementation
- Security considerations
- Deployment strategy
- UI/UX design direction

---

## Future Enhancements

### Planned Features

1. **Advanced Flight Planning**
   - Obstacle avoidance path planning
   - Weather integration for flight safety
   - Battery optimization algorithms

2. **Enhanced Analytics**
   - Machine learning for mission duration prediction
   - Anomaly detection in drone telemetry
   - Coverage optimization suggestions

3. **Multi-Organization Support**
   - Tenant isolation
   - Organization-level permissions
   - Shared drone pools

4. **Mobile Application**
   - React Native companion app
   - Field operator interface
   - Offline mission planning

5. **Integration APIs**
   - Webhook support for external systems
   - Third-party drone manufacturer APIs
   - GIS system integration

---

## Appendix

### Demo Credentials

```
Email: admin@dronesurvey.com
Password: password123
```

### Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd drone-survey-management

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install

# Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Setup database
cd server
npm run migrate
npm run seed

# Start development servers
npm run dev  # From root directory
```

### Project Statistics

- Total Lines of Code: ~15,000+
- React Components: 25+
- API Endpoints: 20+
- Database Tables: 5
- WebSocket Events: 8

---

*This documentation provides a comprehensive overview of the Drone Survey Management System architecture, implementation details, and design decisions.*
