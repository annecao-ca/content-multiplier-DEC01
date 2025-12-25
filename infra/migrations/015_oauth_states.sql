-- Migration: Add OAuth states table for publishing authentication
-- Date: 2025-12-23

-- OAuth states for managing authentication flows
CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    code_verifier TEXT,
    redirect_uri TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for cleanup of expired states
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_platform ON oauth_states(user_id, platform);

-- Done
SELECT 'Migration 015: OAuth states table added successfully!' as status;

