# System Architecture - Research Scholars Management Portal

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │  Mobile App  │  │  API Client  │         │
│  │  (Tailwind)  │  │   (Future)   │  │   (Future)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   HTTPS/SSL     │
                    └────────┬────────┘
                             │
┌─────────────────────────────▼───────────────────────────────────┐
│                    APPLICATION LAYER (Flask)                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Authentication & Authorization             │   │
│  │         ┌────────────┐  ┌──────────────────┐           │   │
│  │         │    JWT     │  │  Role-Based      │           │   │
│  │         │  Tokens    │  │  Access Control  │           │   │
│  │         └────────────┘  └──────────────────┘           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────── API Routes (Blueprints) ─────────────┐  │
│  │                                                            │  │
│  │  ┌──────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │  │
│  │  │ Auth │ │ Scholars│ │Supervisors│ │  Committees  │    │  │
│  │  └──────┘ └─────────┘ └──────────┘ └──────────────┘    │  │
│  │                                                            │  │
│  │  ┌──────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │  │
│  │  │ Exams│ │Seminars │ │ Synopsis │ │   Progress   │    │  │
│  │  └──────┘ └─────────┘ └──────────┘ └──────────────┘    │  │
│  │                                                            │  │
│  │  ┌──────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │  │
│  │  │Thesis│ │  Travel │ │Notifications│ │   Calendar  │    │  │
│  │  │      │ │  Grants │ │             │ │             │    │  │
│  │  └──────┘ └─────────┘ └──────────┘ └──────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────── Business Logic Layer ─────────────────┐   │
│  │                                                           │   │
│  │  ┌──────────────────┐  ┌──────────────────┐            │   │
│  │  │  Notification    │  │  Email Service   │            │   │
│  │  │    Service       │  │                  │            │   │
│  │  └──────────────────┘  └──────────────────┘            │   │
│  │                                                           │   │
│  │  ┌──────────────────┐  ┌──────────────────┐            │   │
│  │  │  File Handler    │  │  Workflow Engine │            │   │
│  │  │                  │  │  (Approvals)     │            │   │
│  │  └──────────────────┘  └──────────────────┘            │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────── Data Access Layer (ORM) ──────────────┐   │
│  │                    SQLAlchemy Models                     │   │
│  │                                                           │   │
│  │  User │ Scholar │ Supervisor │ School │ Committee       │   │
│  │  Exam │ Seminar │ Synopsis │ ProgressReport │ Thesis    │   │
│  │  TravelGrant │ TravelGrantApproval │ Notification      │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                     DATABASE LAYER                            │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                        │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │  │
│  │  │  Users   │  │ Scholars │  │   Supervisors    │     │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │  │
│  │  │  Exams   │  │ Seminars │  │    Synopsis      │     │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │  │
│  │  │  Travel  │  │Committees│  │  Notifications   │     │  │
│  │  │  Grants  │  │          │  │                  │     │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                           │
│                                                                │
│  ┌──────────────────┐              ┌──────────────────┐      │
│  │   SMTP Server    │              │  File Storage    │      │
│  │  (Email Sending) │              │   (Local/S3)     │      │
│  └──────────────────┘              └──────────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Authentication Flow

```
┌──────┐                ┌──────┐              ┌──────────┐
│Client│                │Flask │              │PostgreSQL│
└───┬──┘                └───┬──┘              └────┬─────┘
    │                       │                      │
    │ POST /api/auth/login  │                      │
    ├──────────────────────>│                      │
    │  {email, password}    │                      │
    │                       │  Query User          │
    │                       ├─────────────────────>│
    │                       │                      │
    │                       │<─────────────────────┤
    │                       │  User Record         │
    │                       │                      │
    │                       │ Verify Password      │
    │                       │ Generate JWT Tokens  │
    │                       │                      │
    │<──────────────────────┤                      │
    │ {access_token,        │                      │
    │  refresh_token,       │                      │
    │  user}                │                      │
    │                       │                      │
    │ Store tokens in       │                      │
    │ localStorage          │                      │
    │                       │                      │
```

### 2. Document Submission Flow (Synopsis Example)

```
┌───────┐      ┌──────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│Scholar│      │Flask │      │File      │      │Database │      │Supervisor│
└───┬───┘      └───┬──┘      │Handler   │      └────┬────┘      └────┬─────┘
    │              │          └────┬─────┘           │                │
    │Upload Synopsis│               │                │                │
    ├─────────────>│               │                │                │
    │              │ Save File     │                │                │
    │              ├──────────────>│                │                │
    │              │               │                │                │
    │              │<──────────────┤                │                │
    │              │ File Path     │                │                │
    │              │               │                │                │
    │              │ Create Synopsis Record         │                │
    │              ├───────────────────────────────>│                │
    │              │                                │                │
    │              │ Send Notification              │                │
    │              ├────────────────────────────────────────────────>│
    │              │                                │                │
    │<─────────────┤                                │                │
    │ Success      │                                │                │
    │              │                                │                │
    │              │                                │   Email Alert  │
    │              │                                │<───────────────┤
    │              │                                │                │
```

### 3. Travel Grant Approval Workflow

```
┌───────┐     ┌──────────┐     ┌──┐     ┌──────┐     ┌────┐     ┌──────┐
│Scholar│     │Supervisor│     │DC│     │School│     │AD  │     │Dean  │
│       │     │          │     │  │     │Chair │     │Res.│     │Acad. │
└───┬───┘     └─────┬────┘     └┬─┘     └───┬──┘     └─┬──┘     └───┬──┘
    │               │           │           │          │            │
    │ Submit Grant  │           │           │          │            │
    ├──────────────>│           │           │          │            │
    │               │           │           │          │            │
    │               │ Approve   │           │          │            │
    │               ├──────────>│           │          │            │
    │               │           │           │          │            │
    │               │           │ Approve   │          │            │
    │               │           ├──────────>│          │            │
    │               │           │           │          │            │
    │               │           │           │ Approve  │            │
    │               │           │           ├─────────>│            │
    │               │           │           │          │            │
    │               │           │           │          │ Approve    │
    │               │           │           │          ├───────────>│
    │               │           │           │          │            │
    │               │           │           │          │            │ Final
    │               │           │           │          │            │ Approval
    │<──────────────┴───────────┴───────────┴──────────┴────────────┤
    │ Grant Approved (All Stages Complete)                           │
    │                                                                │
```

## Component Interactions

### Scholar Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                     Scholar Dashboard                        │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   Profile Section   │  │   Stats Section     │          │
│  │                     │  │                     │          │
│  │  • Name            │  │  • Exams: 2        │          │
│  │  • Enrollment No.  │  │  • Seminars: 1     │          │
│  │  • Program: PhD    │  │  • Grants: 1       │          │
│  │  • Supervisor      │  │  • Reports: 3      │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │           Quick Actions                       │          │
│  │                                               │          │
│  │  [Submit Synopsis]  [Submit Progress Report] │          │
│  │  [Apply for Grant]  [View Calendar]          │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │           Upcoming Events                     │          │
│  │                                               │          │
│  │  • Comprehensive Exam - Dec 15, 2024         │          │
│  │  • Open Seminar - Nov 20, 2024               │          │
│  │  • Progress Report Due - Nov 30, 2024        │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │           Recent Notifications                │          │
│  │                                               │          │
│  │  🔔 Synopsis reviewed - Changes requested    │          │
│  │  ✅ Travel grant approved by supervisor      │          │
│  │  📅 Exam scheduled for Dec 15                │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Database Entity Relationships

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─────────────┬─────────────┐
     │             │             │
┌────▼────┐   ┌───▼────┐   ┌───▼──────────┐
│ Scholar │   │Supervisor│   │Notification │
└────┬────┘   └────┬─────┘   └──────────────┘
     │             │
     ├──────┬──────┼──────┬──────┬──────┬──────┐
     │      │      │      │      │      │      │
┌────▼───┐ │ ┌────▼───┐  │  ┌───▼───┐  │  ┌───▼────┐
│Committee│ │ │  Exam  │  │  │Seminar│  │  │Synopsis│
└────┬───┘ │ └────────┘  │  └───────┘  │  └────────┘
     │     │             │              │
┌────▼────┐│             │              │
│Committee││             │              │
│ Member  ││             │              │
└─────────┘│             │              │
           │             │              │
      ┌────▼─────────┐   │         ┌────▼────────┐
      │  Progress    │   │         │   Thesis    │
      │   Report     │   │         └─────────────┘
      └──────────────┘   │
                         │
                    ┌────▼──────┐       ┌────────────────┐
                    │  Travel   │◄──────│TravelGrant     │
                    │   Grant   │       │Approval        │
                    └───────────┘       └────────────────┘

┌─────────┐
│ School  │
└────┬────┘
     │
     ├──────────┬──────────┐
     │          │          │
┌────▼────┐ ┌──▼─────┐ ┌──▼──────┐
│ Scholar │ │Supervisor│ │ Chair  │
└─────────┘ └──────────┘ └─────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Transport Layer Security (HTTPS)           │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼──────────────────────────┐    │
│  │         Authentication (JWT Tokens)                │    │
│  │  • Access Token (1 hour)                          │    │
│  │  • Refresh Token (30 days)                        │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼──────────────────────────┐    │
│  │      Authorization (Role-Based Access Control)     │    │
│  │  • Scholar → Personal data only                   │    │
│  │  • Supervisor → Supervised scholars               │    │
│  │  • DC/ADC → Assigned scholars                     │    │
│  │  • School Chair → School-wide data                │    │
│  │  • Dean → Full access                             │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼──────────────────────────┐    │
│  │           Input Validation & Sanitization          │    │
│  │  • Request data validation                        │    │
│  │  • File type checking                             │    │
│  │  • SQL injection prevention                       │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼──────────────────────────┐    │
│  │              Data Layer Security                   │    │
│  │  • Password hashing (Werkzeug)                    │    │
│  │  • Parameterized queries (SQLAlchemy)             │    │
│  │  • Database connection pooling                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌───────────────────── Production Environment ─────────────────┐
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Load Balancer                      │   │
│  │                   (Nginx/HAProxy)                     │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐      │
│  │  Flask App  │   │  Flask App  │   │  Flask App  │      │
│  │ (Gunicorn)  │   │ (Gunicorn)  │   │ (Gunicorn)  │      │
│  │  Worker 1   │   │  Worker 2   │   │  Worker 3   │      │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘      │
│         └─────────────────┼─────────────────┘               │
│                           │                                   │
│  ┌───────────────────────▼────────────────────────────┐    │
│  │              PostgreSQL Database                    │    │
│  │           (Master-Slave Replication)                │    │
│  │                                                      │    │
│  │  ┌─────────────┐          ┌─────────────┐         │    │
│  │  │   Master    │──Repl──→│    Slave    │         │    │
│  │  │ (Read/Write)│          │ (Read Only) │         │    │
│  │  └─────────────┘          └─────────────┘         │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              File Storage (S3/Local)                  │   │
│  │  • Organized by document type                        │   │
│  │  • Backup and versioning                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           External Services Integration               │   │
│  │  • SMTP Server (Email)                               │   │
│  │  • Monitoring (New Relic/DataDog)                    │   │
│  │  • Logging (ELK Stack)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## API Request/Response Flow

```
Client Request
      │
      ▼
┌──────────────┐
│ Nginx/Server │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Flask App     │
│(Gunicorn)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│JWT Validation│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│RBAC Check    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Route Handler │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Business Logic│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Database Query│
│(SQLAlchemy)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Response JSON │
└──────┬───────┘
       │
       ▼
   Client
```

## Scalability Considerations

### Horizontal Scaling
- Multiple Flask app instances behind load balancer
- Stateless JWT authentication (no session storage)
- Database read replicas for query distribution

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries with proper indexing
- Use connection pooling

### Caching Strategy (Future)
```
┌──────────┐
│  Redis   │
│  Cache   │
└────┬─────┘
     │
     ├─ User sessions
     ├─ Frequently accessed data
     ├─ API rate limiting
     └─ Notification queues
```

---

**This architecture supports the complete system requirements and is designed for scalability, security, and maintainability.**
