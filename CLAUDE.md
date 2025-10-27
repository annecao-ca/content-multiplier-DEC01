# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Infrastructure
- `./scripts/dev.sh` - Start PostgreSQL with pgvector and run migrations (requires Docker)
- `docker compose -f infra/docker-compose.yml up -d` - Start database only
- `psql "$DATABASE_URL" -f infra/migrations/001_init.sql` - Run initial migrations
- `psql "$DATABASE_URL" -f infra/migrations/003_publishing_integrations.sql` - Run publishing migrations
- `psql "$DATABASE_URL" -f infra/migrations/004_twitter_bot.sql` - Run Twitter bot migrations

### Twitter Bot Management
- `./scripts/twitter-bot start` - Start automated Twitter bot service
- `./scripts/twitter-bot stop` - Stop Twitter bot service
- `./scripts/twitter-bot status` - Check bot status and statistics
- `./scripts/twitter-bot config` - View/update bot configuration
- `./scripts/twitter-bot logs` - View recent bot activity

### API (Fastify Backend)
- `cd apps/api && pnpm dev` - Start API server on port 3001 with hot reload
- `cd apps/api && pnpm start` - Start API server in production mode

### Web (Next.js Frontend)  
- `cd apps/web && pnpm dev` - Start web server on port 3000 with hot reload
- `cd apps/web && pnpm build` - Build for production
- `cd apps/web && pnpm start` - Start production build

### Dependencies
- `pnpm install` - Install all workspace dependencies (run from root)

## Architecture Overview

### Monorepo Structure
- `apps/api/` - Fastify TypeScript API server with PostgreSQL + pgvector
- `apps/web/` - Next.js frontend with App Router, React components, and TypeScript
- `packages/` - Shared utilities, types, and schemas
- `infra/` - Docker Compose setup and SQL migrations
- `scripts/` - Development automation scripts

### Backend (API)
- **Framework**: Fastify with TypeScript ES modules
- **Database**: PostgreSQL with pgvector extension for embeddings
- **LLM Integration**: Multi-provider support (OpenAI, DeepSeek, Anthropic, Gemini, Grok) via unified client in `services/llm.ts`
- **Key Services**:
  - `services/conductor.ts` - State management for content workflow
  - `services/rag.ts` - Vector search and document ingestion
  - `services/guardrails.ts` - Content validation and citation checking
  - `services/telemetry.ts` - Event tracking and analytics
  - `services/publishing/` - Multi-platform publishing orchestration
- **Publishing System**:
  - `services/publishing/oauth.ts` - OAuth authentication with AES-256-GCM encryption
  - `services/publishing/orchestrator.ts` - Publishing workflow and job management
  - `services/publishing/social-media.ts` - Twitter, LinkedIn, Facebook, Instagram integrations
  - `services/publishing/email.ts` - SendGrid and Mailchimp integrations
  - `services/publishing/cms.ts` - WordPress and Medium integrations
  - `services/publishing/webhooks.ts` - Custom webhook system with retry logic
  - `services/publishing/twitter-bot.ts` - Automated Twitter content generation and scheduling

### Frontend (Web)
- **Framework**: Next.js 14 with App Router and TypeScript
- **Components**: React components in `app/components/`
- **Internationalization**: Context-based language switching (EN/VN) via `LanguageContext`
- **Rich Text**: Markdown editor with base64 image support and PDF export
- **API Communication**: Direct fetch calls to backend API
- **Publishing Interface**:
  - `app/components/PublishingPanel.tsx` - Multi-platform publishing interface
  - `app/components/TwitterBotPanel.tsx` - Twitter bot management interface
  - `app/settings/publishing/` - Platform credential management
  - `app/settings/twitter-bot/` - Twitter bot configuration and monitoring
  - `app/analytics/` - Publishing metrics and performance dashboard

### Content Workflow States
Content progresses through states managed by conductor service:
1. `idea` - Generated content ideas
2. `brief` - Research briefs with RAG integration  
3. `draft` - Initial content drafts
4. `derivatives` - SEO-optimized variations
5. `ready_for_review` - Content passing guardrails
6. `published` - Distributed content

### Database Schema
- Core tables: `ideas`, `briefs`, `content_packs`, `events`
- RAG tables: `documents`, `document_chunks` with vector embeddings
- Publishing tables: `publishing_credentials`, `publishing_queue`, `publishing_results`, `webhook_configurations`, `webhook_deliveries`
- Twitter bot tables: `twitter_content_templates`, `platform_configurations` (for bot config)
- Event-driven architecture with comprehensive telemetry tracking

### Environment Configuration
- Database: `DATABASE_URL=postgres://cm:cm@localhost:5432/cm`
- LLM: Provider-specific API keys (OPENAI_API_KEY, etc.)
- API: `PORT=3001` for backend server
- Publishing: OAuth credentials and API keys for social platforms (see `.env.publishing.example`)
  - `PUBLISHING_ENCRYPTION_KEY` - 32-character hex key for credential encryption
  - Platform OAuth: `TWITTER_CLIENT_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET`, etc.
  - Email services: `SENDGRID_API_KEY`, `MAILCHIMP_API_KEY`

### Key Patterns
- JSON schema validation with AJV for LLM responses
- Event-driven state transitions with telemetry
- Multi-provider LLM abstraction with failover support
- RAG-based research with citation tracking for guardrails
- Export capabilities (CSV, ICS) for distribution planning
- **Publishing Architecture**:
  - OAuth 2.0 flows with secure credential storage
  - Queue-based asynchronous publishing with retry logic
  - Platform-specific content formatting and validation
  - Webhook system for custom integrations
  - Real-time publishing status tracking and analytics

## Publishing Integration Features

### Supported Platforms
- **Social Media**: Twitter/X, LinkedIn, Facebook, Instagram
- **Email Services**: SendGrid, Mailchimp
- **CMS Platforms**: WordPress, Medium
- **Custom Integrations**: Webhook system for any platform

### Key Capabilities
- **Multi-Platform Publishing**: Publish content to multiple platforms simultaneously
- **Scheduled Publishing**: Schedule posts for optimal timing
- **Content Formatting**: Automatic platform-specific content adaptation
- **Analytics Dashboard**: Track engagement metrics across all platforms
- **Credential Management**: Secure OAuth token storage with encryption
- **Webhook System**: Custom integrations with retry mechanisms
- **Real-time Status**: Live publishing status and error reporting

### API Endpoints
- `GET/POST /api/publishing/auth/:platform` - OAuth authentication
- `POST /api/publishing/publish` - Publish content to selected platforms
- `GET /api/publishing/status/:pack_id` - Get publishing status
- `GET/POST/DELETE /api/publishing/webhooks` - Manage webhooks
- `GET/DELETE /api/publishing/credentials` - Manage platform credentials
- `GET /api/publishing/analytics/:pack_id` - Get publishing analytics

### Security Features
- AES-256-GCM encryption for all stored credentials
- OAuth state parameter for CSRF protection
- Webhook signature verification with HMAC-SHA256
- Secure token refresh mechanisms
- User-scoped credential access control

## Twitter Bot Integration Features

### Automated Content Generation
- **AI-Powered Content**: Uses configured LLM providers for tweet generation
- **Content Templates**: Customizable prompt templates for different content styles
- **Topic-Based Generation**: Configurable content topics and themes
- **Thread Support**: Automatic Twitter thread creation for longer content
- **Content Validation**: Ensures character limits and platform requirements

### Smart Scheduling System
- **Flexible Scheduling**: Configure specific posting times (e.g., 09:00, 15:00, 21:00)
- **Daily Limits**: Automatic enforcement of daily posting limits
- **Interval Fallback**: Fallback to interval-based posting if schedule times not set
- **Timezone Support**: All scheduling respects system timezone
- **Smart Retry**: Exponential backoff and retry logic for failed posts

### Service Management
- **CLI Interface**: Systemctl-like commands for service management
- **Web Dashboard**: Complete web-based management interface
- **Real-time Status**: Live status monitoring and statistics
- **Activity Logging**: Complete history of bot activity and performance
- **Error Handling**: Comprehensive error reporting and debugging

### Twitter Bot API Endpoints
- `POST/DELETE /api/twitter-bot/start|stop` - Service control
- `GET /api/twitter-bot/status` - Status and statistics
- `GET/PUT /api/twitter-bot/config` - Configuration management
- `GET/POST/PUT/DELETE /api/twitter-bot/templates` - Content template management
- `GET /api/twitter-bot/history` - Activity history and logs
- `POST /api/twitter-bot/test-generate` - Test content generation

### Content Templates System
- **Built-in Templates**: Tech tips, AI insights, startup wisdom, coding tips
- **Custom Templates**: Create custom prompt templates for specific needs
- **Topic Targeting**: Associate templates with specific content topics
- **Tone Control**: Professional, casual, humorous, educational tones
- **Hashtag Management**: Automatic hashtag suggestions and management

### CLI Management Commands
- `./scripts/twitter-bot start|stop` - Service control
- `./scripts/twitter-bot status` - Detailed status and statistics  
- `./scripts/twitter-bot config` - Configuration management
- `./scripts/twitter-bot logs` - Recent activity logs
- `./scripts/twitter-bot enable|disable` - Quick enable/disable posting