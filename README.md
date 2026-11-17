# Digital Career Guidance System
![alt text](image.png)
![alt text](image-1.png)

The Digital Career Guidance System (DCGS) is an AI-assisted career guidance platform for South African learners. It connects a learner's academic results, APS score, interests, assessment profile, and university/course requirements to provide practical study and career guidance.

![alt text](image-2.png)


The application is a server-rendered Node.js web application with:

- Student registration, login, profile management, and password recovery
- Parent/guardian access to linked student information
- Administrator and super-administrator dashboards
- Report-card upload and OCR processing
- Subject result confirmation and APS calculation
- RIASEC-style career assessment
- Course and university recommendations
- AI counselling/chat with streaming responses
- Safety-flag and audit-log administration
- PostgreSQL persistence and Cloudinary file storage

## Contents

- [Technology stack](#technology-stack)
- [How the application works](#how-the-application-works)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Running the application](#running-the-application)
- [User journeys](#user-journeys)
- [HTTP routes](#http-routes)
- [Scripts and utilities](#scripts-and-utilities)
- [Testing](#testing)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Known limitations and maintenance notes](#known-limitations-and-maintenance-notes)

## Technology stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js |
| Server | Express 5 |
| Templates | EJS and `express-ejs-layouts` |
| Client-side UI | Vanilla JavaScript and CSS |
| Database | PostgreSQL, including Neon-compatible deployments |
| Database driver | `pg` |
| Authentication | JWT access/refresh tokens in HTTP-only cookies |
| Passwords | `bcryptjs` |
| AI generation | Groq and Google Gemini |
| Vector search | Pinecone |
| Image/file storage | Cloudinary |
| Email | Nodemailer/SMTP |
| Security middleware | Helmet, CORS, CSRF protection, rate limiting, input validation |
| Testing | Jest and Supertest |
| Development server | Nodemon |

## How the application works

1. A learner creates an account and completes a profile.
2. The learner uploads a report card or enters results manually.
3. Uploaded results are stored through the upload/OCR workflow and can be confirmed or edited.
4. The system calculates the learner's APS and compares subjects and marks with course requirements.
5. The learner completes the career assessment, which produces RIASEC scores and a career profile.
6. Recommendation services match the learner with courses, universities, and career options.
7. The AI counsellor uses the learner's context to answer career and admissions questions.
8. Parents can view linked learner information, while administrators manage users, questions, universities, safety flags, OCR uploads, and audit records.

## ScreenShots
![alt text](image-3.png)
![alt text](image-4.png)
![alt text](image-5.png)
![alt text](image-6.png)
![alt text](image-7.png)
![alt text](image-8.png)

## Repository structure

```text
Digital-Career-Guidance-System/
├── server.js                         # Application entry point
├── package.json                      # Dependencies and npm scripts
├── package-lock.json                 # Locked dependency versions
├── .env.example                      # Environment-variable template
├── .env                              # Local secrets; never commit this file
├── database.sql                      # Base PostgreSQL schema/seed SQL
├── neon_schema.sql                   # Standalone Neon-compatible schema
├── schema.sql                        # Additional/legacy schema reference
├── migrations/                       # Incremental database changes
├── scripts/apply_migrations.js       # Applies database.sql and migrations
├── seed.js                           # Standalone admin seeder
├── src/
│   ├── app.js                        # Express configuration and page routes
│   ├── config/database.js            # PostgreSQL pool and query helper
│   ├── controllers/                  # Request handlers
│   ├── middleware/                   # Auth, authorization, CSRF, etc.
│   ├── prompts/                      # AI prompt definitions
│   ├── public/                       # Browser JavaScript, CSS, and images
│   ├── routes/                       # API and page route modules
│   ├── scripts/                      # Admin/university seeders
│   ├── services/                     # Business logic and integrations
│   └── views/                        # EJS pages, layouts, partials, errors
├── tests/                            # Unit and integration tests
├── plans/                            # Feature and analysis planning documents
├── roject-plan.md                    # Product vision and phased plan
├── check-progress.js                 # Database/progress diagnostic
├── verify_db.js                      # Database connectivity diagnostic
└── test-*.js / tmp_*.js              # Focused development diagnostics
```

The `tmp_*.js`, `debug-*.js`, and root `test-*.js` files are developer diagnostics, not production startup files. Review them before running them against a shared or production database.

## Requirements

- Node.js 18 or newer recommended
- npm
- PostgreSQL database (Neon works with the default SSL configuration)
- Credentials for the external services used by the features you enable
- A writable local directory for temporary uploads during development

## Installation

From the directory containing `package.json`:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and add local credentials. Never copy real credentials into this README, source code, issue reports, or commits.

## Environment variables

Use `.env.example` as the authoritative template. The application reads the following variables:

### Database

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_SSL` | Set to `false` only for a local PostgreSQL instance; SSL is enabled by default |

### AI and search

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq model access for parsing, recommendations, and chat |
| `GEMINI_API_KEY` | Gemini access for OCR/AI processing |
| `PINECONE_API_KEY` | Pinecone vector database access |
| `PINECONE_INDEX_NAME` | Pinecone index name |
| `SERPER_API_KEY` | Search integration used by the search service |

### Email and authentication

| Variable | Purpose |
| --- | --- |
| `GMAIL_USER` | Gmail account used for email |
| `GMAIL_PASS` | Gmail app password or SMTP password |
| `SMTP_USER` | SMTP username used by the authentication controller |
| `SMTP_PASS` | SMTP password used by the authentication controller |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_SECURE` | SMTP TLS/secure-mode setting |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SESSION_SECRET` | Session-related secret |

### File storage

| Variable | Purpose |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Application and security

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Environment name, such as `development` or `production` |
| `PORT` | HTTP port; defaults to `3000` |
| `FRONTEND_URL` | Allowed frontend origin for credentialed CORS |
| `DISABLE_CSRF` | Set to `true` only for controlled testing; keep enabled otherwise |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens |
| `JWT_ACCESS_EXPIRY` | Access-token expiry |
| `JWT_REFRESH_EXPIRY` | Refresh-token expiry |
| `JWT_ACCESS_COOKIE_MAX_AGE` | Access-token cookie lifetime in milliseconds |
| `BCRYPT_ROUNDS` | Password hashing cost |
| `OTP_EXPIRY_MINUTES` | Password-reset OTP lifetime |

### Admin seeding

The runtime admin seeder supports:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_ROLE
```
## Admin Dashboard Screenshots
![alt text](image-9.png)
![alt text](image-10.png)
Set these explicitly in non-development environments. Do not rely on development defaults for a deployed application.

## Database setup

The normal setup path is:

```powershell
node scripts/apply_migrations.js
npm run seed:universities
```

`apply_migrations.js` executes `database.sql` followed by the migration files in the required order:

1. `add_chat_tables.sql`
2. `add_results_columns.sql`
3. `add_assessment_columns.sql`
4. `add_assessment_questions.sql`
5. `add_recommendation_columns.sql`
6. `add_recommendation_generated_at.sql`
7. `add_results_meta.sql`

The migration runner uses the `DATABASE_URL` connection and closes the pool after completion.

### Schema files

- `database.sql` is used by the migration runner and should be the starting point for the current application setup.
- `neon_schema.sql` is a standalone Neon-compatible schema and contains destructive `DROP TABLE ... CASCADE` statements. Use it only when intentionally rebuilding a disposable database.
- `schema.sql` is retained as a schema reference. Check the migration set before using it as a fresh production schema.

### Seeding an administrator

The server calls `ensureAdminUser()` during startup. You can also run:

```powershell
npm run seed:admin
```

The package script invokes the root `seed.js`, which contains development credentials in its current implementation. For a new environment, prefer the environment-aware seeder in `src/scripts/seedAdmin.js` and set strong values for `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_ROLE`.

## Running the application

Development mode with automatic restart:

```powershell
npm run dev
```

Production-style start:

```powershell
npm start
```

The default address is [http://localhost:3000](http://localhost:3000). A lightweight health check is available at:

```text
GET /health
```

Expected response shape:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "phase": "0.1.0"
}
```

## User journeys

### Student

- Register and authenticate
- Complete or update a profile
- Upload a report card
- Monitor OCR status
- Confirm or edit extracted results
- View APS and dashboard activity
- Complete the career assessment
- Review RIASEC/career results
- Browse course, university, and career recommendations
- Save recommendations
- Chat with the AI counsellor

### Parent/guardian

- Open the parent dashboard
- View linked children
- View a child's profile, results, and assessment


### Administrator

- View dashboard statistics
- Manage users and roles
- Manage assessment questions
- Review OCR uploads
- Review and resolve safety flags
- Manage university/course information
- Inspect audit logs

## HTTP routes

All API routes are prefixed as shown. Authentication and authorization are applied by the route modules.

### Authentication: `/api/auth`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/register` | Create an account |
| `POST` | `/login` | Authenticate |
| `POST` | `/refresh` | Refresh access authentication |
| `POST` | `/logout` | Clear authentication |
| `POST` | `/forgot-password` | Start password recovery |
| `POST` | `/reset-password/:token` | Complete password recovery |
| `GET` | `/me` | Get the current user |
| `PUT` | `/profile` | Update the current profile |
| `POST` | `/change-password` | Change password |
| `GET` | `/users` | List users for authorized administrators |

### Results: `/api/results`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/upload` | Upload a report card as `reportCard` |
| `GET` | `/status/:uploadId` | Check OCR/upload status |
| `GET` | `/latest` | Get latest results |
| `POST` | `/confirm` | Confirm extracted results |
| `PUT` | `/:id` | Edit a result |

### Assessment: `/api/assessment`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/questions` | Get active questions |
| `GET` | `/status` | Get current assessment status |
| `GET` | `/latest` | Get latest assessment |
| `GET` | `/riasec-info` | Get RIASEC information |
| `GET` | `/results/:id` | Get assessment results |
| `POST` | `/start` | Start an assessment |
| `POST` | `/response` | Submit an answer |
| `POST` | `/complete` | Complete an assessment |

### Recommendations: `/api/recommendations`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/course/:courseId` | Get a course recommendation/detail |
| `GET` | `/matches` | Get course matches |
| `GET` | `/universities` | Get university recommendations |
| `GET` | `/saved` | Get saved recommendations |
| `GET` | `/count` | Get recommendation count |

### Chat: `/api/chat`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/stream` | Stream an AI chat response |
| `GET` | `/sessions` | List chat sessions |
| `GET` | `/sessions/:id` | Get a chat session |
| `POST` | `/sessions/:id/end` | End a chat session |
| `GET` | `/suggested-prompts` | Get suggested prompts |

### Parent: `/api/parent`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/dashboard` | Parent dashboard data |
| `GET` | `/children` | List linked children |
| `GET` | `/children/:childId` | Child details |
| `GET` | `/children/:childId/results` | Child results |
| `GET` | `/children/:childId/assessment` | Child assessment |

### Admin: `/api/admin`

Administrative endpoints cover dashboard statistics, users, assessment questions, OCR uploads, safety flags, universities, courses, and audit logs. The corresponding page routes are available under `/admin`.

### Browser pages

The main rendered pages include:

```text
/                    Landing page
/dashboard           Student dashboard
/profile             Profile
/upload              Result upload
/assessment          Assessment
/assessment/results  Assessment results
/recommendations     Recommendations
/explore             University exploration
/counsellor          AI counsellor
/counselor           US spelling alias for AI counsellor
/parent/dashboard    Parent dashboard
/admin/dashboard     Admin dashboard
/privacy             Privacy policy
/terms               Terms of service
/contact             Contact page
/help                Help center
/health              Health check
```

## Scripts and utilities

| Command | What it does |
| --- | --- |
| `npm start` | Starts `server.js` |
| `npm run dev` | Starts the server with Nodemon |
| `npm test` | Runs Jest |
| `npm run seed:universities` | Seeds university/course data |
| `npm run seed:admin` | Runs the root admin seeder |
| `node scripts/apply_migrations.js` | Applies the base schema and migrations |
| `node verify_db.js` | Checks database connectivity |
| `node check-progress.js` | Runs database/progress diagnostics |

## Testing

Run the existing Jest suite:

```powershell
npm test
```

The test suite includes:

- Assessment service regression tests
- Dashboard service tests
- Authentication integration tests using Supertest

Some diagnostic scripts require a live `DATABASE_URL` and may modify or inspect database data. Run them only against a controlled development/test database.

## Security

- Keep `.env` private. It is ignored by Git and must never be committed.
- If credentials have been exposed, rotate them immediately: database password/URL, AI keys, SMTP credentials, Cloudinary credentials, OAuth secrets, and JWT secrets.
- Use long, random JWT access and refresh secrets.
- Keep CSRF enabled outside controlled local testing.
- Use HTTPS in production so secure cookies and transport protection work correctly.
- Restrict `FRONTEND_URL` and review the deployed CORS allowlist.
- Use a separate database and service credentials for development, staging, and production.
- Do not use the development admin password in any shared environment.
- Avoid logging tokens, passwords, API keys, report-card contents, or personally identifiable learner data.
- Review POPIA obligations before storing or processing learner information in production.

The application includes Helmet, CORS configuration, HTTP-only cookie authentication, CSRF middleware, rate limiting, validation, and role-based authorization. These controls still require production configuration and operational monitoring.

## Deployment

A deployment should follow this sequence:

1. Provision PostgreSQL and external service accounts.
2. Configure all environment variables in the hosting provider's secret manager.
3. Run the base schema and migrations against the target database.
4. Seed only the required university/course data.
5. Create or verify an administrator using strong credentials.
6. Start the server with `npm start`.
7. Confirm `GET /health`.
8. Test registration, login, upload, assessment, recommendation, chat, parent, and admin flows.
9. Confirm logs do not contain secrets or learner data.

The project plan identifies Render as the intended hosting platform, but the application can run on any Node.js host that provides environment variables, network access to PostgreSQL, and persistent access to the configured external services.

## Troubleshooting

### `DATABASE_URL` is missing

Copy `.env.example` to `.env`, set `DATABASE_URL`, and restart the process. The database module loads environment variables through `dotenv`.

### Database connection fails

- Confirm the URL is valid and reachable.
- Confirm SSL settings. Neon normally requires the default SSL behavior; local PostgreSQL may need `DATABASE_SSL=false`.
- Run `node verify_db.js`.
- Apply the schema and migrations before starting feature workflows.

### Authentication tokens fail

- Set both `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Check the configured expiry values.
- Use HTTPS and correct cookie settings in production.
- Make sure the browser is sending credentials when the frontend is on a different origin.

### Upload/OCR processing fails

- Confirm `GEMINI_API_KEY`, `GROQ_API_KEY`, and Cloudinary variables.
- Check the upload status endpoint.
- Inspect server logs without printing uploaded document contents or credentials.

### Email recovery does not send

- Configure the SMTP variables used by the authentication controller.
- Use a provider-approved app password where required.
- Check SMTP host, port, secure mode, and sender credentials.

### AI chat or recommendations fail

- Confirm the relevant AI keys and Pinecone index configuration.
- Check provider quotas and service status.
- Verify the database contains the learner context expected by the service.

## Known limitations and maintenance notes

- The project contains both current application code and historical/debug scripts. Treat only the documented startup and migration paths as production workflows.
- The root `seed.js` currently contains development admin defaults; replace that behavior before using the package seeder in a shared environment.
- `src/scripts/seedAdmin.js` is the environment-aware admin seeder used during server startup.
- `neon_schema.sql` is destructive and should not be run casually against an existing database.
- The project plan describes a Python/FastAPI OCR microservice, but the current repository is primarily Node.js/Express and the visible OCR integrations are implemented through the JavaScript services.
- External AI, search, email, storage, and vector services are optional only for the features that use them; production configuration should make required dependencies explicit.
- Database migrations should be reviewed and tested on a disposable database before production execution.

## Contributing

1. Create a branch for the change.
2. Do not commit `.env`, credentials, report cards, database dumps, or generated secrets.
3. Update the relevant migration or service documentation when changing behavior.
4. Run `npm test`.
5. Manually verify affected authenticated and role-specific flows.
6. Review the diff for secrets and personally identifiable information before opening a pull request.

## License

The `package.json` currently declares the ISC license. Confirm that this is still the intended project license before publishing or redistributing the application.
