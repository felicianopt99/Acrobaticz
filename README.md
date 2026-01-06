# AV-RENTALS Platform

**Enterprise-Grade Audio/Visual Equipment Rental Management System**

> Professional rental platform with cloud storage, catalog generation, and multi-user management.

---

## 📋 Quick Navigation

### 🚀 Getting Started
- **[Setup Guide](docs/setup/)** - Installation and initial configuration
- **[Deployment Checklist](docs/deployment/DEPLOYMENT_READY_CHECKLIST.md)** - Production deployment steps
- **[Docker Setup](docs/deployment/DOCKER_SETUP.md)** - Docker containerization guide

### 📚 Documentation
- **[Architecture](docs/architecture/)** - System design and technical specifications
- **[Feature Guides](docs/guides/)** - Feature documentation and testing guides
- **[API Reference](docs/api/)** - API endpoints and integration

### 🛠️ Tools & Scripts
- **[Development Scripts](tools/scripts/)** - Utility scripts and automation tools
- **[Cleanup Tools](docs/CLEANUP_COMPLETE.md)** - Repository maintenance utilities

---

## 🎯 Core Features

### 📦 Equipment Management
- Catalog generation with PDF export
- Equipment tracking and inventory
- Professional catalog sharing

### ☁️ Cloud Storage
- Secure file management
- Storage quota and backup system
- Real-time synchronization

### 📧 Notifications
- Event-based notifications
- User preferences and settings
- Real-time updates

### 👥 Multi-User System
- Role-based access control
- Client management
- Partner administration

### 📅 Rental Management
- Event calendar integration
- Quote generation
- Booking system

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16, React 18, TypeScript |
| **Backend** | Node.js, Prisma ORM |
| **Database** | PostgreSQL |
| **Storage** | Cloud Drive Integration |
| **UI Framework** | Tailwind CSS, Radix UI |
| **Real-time** | Socket.io |
| **Containerization** | Docker, Docker Compose |

---

## 📦 Project Structure

```
AV-RENTALS/
├── src/                    # Application source code
│   ├── app/               # Next.js pages and routes
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
│
├── prisma/                # Database schema and migrations
├── seeding/               # Database seed data
├── public/                # Static assets
│
├── docs/                  # Documentation (organized)
│   ├── setup/            # Setup and getting started
│   ├── deployment/       # Deployment guides
│   ├── guides/           # Feature documentation
│   ├── architecture/     # System architecture
│   └── api/              # API reference
│
├── tools/scripts/        # Development tools and scripts
├── nginx/                # Nginx configuration
├── certbot/              # SSL certificate management
│
├── package.json          # Dependencies
├── docker-compose.yml    # Docker Compose configuration
└── next.config.ts        # Next.js configuration
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Installation

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd AV-RENTALS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   npm run db:generate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Access at: `http://localhost:3000`

---

## 📚 Documentation

All documentation is organized in the `docs/` directory:

- **[docs/setup/](docs/setup/)** - Installation and configuration
- **[docs/deployment/](docs/deployment/)** - Production deployment
- **[docs/guides/](docs/guides/)** - Feature documentation
- **[docs/architecture/](docs/architecture/)** - Technical design
- **[docs/api/](docs/api/)** - API documentation

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server

# Building
npm run build           # Build for production
npm start               # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:seed         # Seed database
npm run db:seed:test    # Test seed with all data

# Notifications
npm run notifications:generate  # Generate notification emails
```

Additional tools available in `tools/scripts/`

---

## 📋 Environment Variables

Key environment variables (see `.env` file):

```env
# Database
DATABASE_URL=postgresql://...

# API Keys
GOOGLE_API_KEY=...
DEEPL_API_KEY=...

# Storage
CLOUD_STORAGE_PATH=...

# Authentication
JWT_SECRET=...

# Email
SMTP_HOST=...
SMTP_PORT=...
```

Complete reference: See `.env.production` for production variables.

---

## 🐳 Docker

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up -d
```

See [Docker Setup Guide](docs/deployment/DOCKER_SETUP.md) for details.

---

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Encrypted data storage
- SQL injection prevention (Prisma ORM)
- CORS and CSRF protection
- Rate limiting on API endpoints

---

## 🧪 Testing

```bash
# Feature testing guides available in docs/guides/
# See TESTING.md for detailed test procedures
```

---

## 📈 Performance & Optimization

- Next.js Turbopack for fast builds
- Image optimization
- Database query optimization
- Caching strategies
- CDN integration ready

---

## 🐛 Troubleshooting

Common issues and solutions are documented in:
- **[Setup Guide](docs/setup/README.md)** - Setup issues
- **[Deployment Guide](docs/deployment/)** - Deployment problems
- **[Feature Guides](docs/guides/)** - Feature-specific issues

---

## 📞 Support & Contribution

### Reporting Issues
1. Check existing documentation in `docs/`
2. Review troubleshooting guides
3. Create detailed issue report with:
   - Error message
   - Steps to reproduce
   - Environment details

### Contributing
1. Follow code style conventions
2. Write tests for new features
3. Update documentation
4. Submit pull request

---

## 📝 License

[Your License Here]

---

## 🎯 Project Status

- ✅ Core features implemented
- ✅ Cloud storage integrated
- ✅ Multi-user system operational
- ✅ Production ready
- ✅ Documentation complete

---

## 📞 Questions?

- **Documentation**: See `docs/` directory
- **Getting Started**: See `docs/setup/README.md`
- **API Help**: See `docs/api/`
- **Deployment**: See `docs/deployment/`

---

**Last Updated**: January 5, 2026  
**Version**: 1.0.0 (Production Ready)

