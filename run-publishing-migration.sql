-- ===== PUBLISHING MIGRATIONS =====
-- Copy toàn bộ nội dung này và paste vào Railway PostgreSQL Query tab

-- 1. Publishing Credentials Table
CREATE TABLE IF NOT EXISTS publishing_credentials (
    credential_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    platform TEXT NOT NULL,
    credential_type TEXT NOT NULL,
    encrypted_credentials JSONB NOT NULL,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. OAuth States Table
CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    code_verifier TEXT,
    redirect_uri TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Publishing Queue Table
CREATE TABLE IF NOT EXISTS publishing_queue (
    queue_id BIGSERIAL PRIMARY KEY,
    pack_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Publishing Results Table  
CREATE TABLE IF NOT EXISTS publishing_results (
    result_id BIGSERIAL PRIMARY KEY,
    queue_id BIGINT,
    platform TEXT NOT NULL,
    external_id TEXT,
    external_url TEXT,
    metrics JSONB,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Add publishing columns to content_packs if not exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_packs' AND column_name = 'publishing_status') THEN
        ALTER TABLE content_packs ADD COLUMN publishing_status TEXT DEFAULT 'not_published';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_packs' AND column_name = 'last_published_at') THEN
        ALTER TABLE content_packs ADD COLUMN last_published_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_packs' AND column_name = 'publishing_errors') THEN
        ALTER TABLE content_packs ADD COLUMN publishing_errors JSONB;
    END IF;
END $$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_pub_creds_platform ON publishing_credentials(platform, is_active);
CREATE INDEX IF NOT EXISTS idx_pub_queue_status ON publishing_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- Done
SELECT 'Publishing tables created successfully!' as status;

