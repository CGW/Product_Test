-- ============================================================
-- TENANTS (each "Oracle_App_Instance")
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    business_name   TEXT,
    owner_email     TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    google_id       TEXT,
    email           TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    avatar_url      TEXT,
    role            TEXT NOT NULL DEFAULT 'user'
        CHECK(role IN ('app_owner_admin','app_admin','oracle_card_admin','user')),
    onboarding_completed  INTEGER NOT NULL DEFAULT 0,
    onboarding_data       TEXT DEFAULT '{}',
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);

-- ============================================================
-- TENANT THEMES (white-label customization)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_themes (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color   TEXT NOT NULL DEFAULT '#6B46C1',
    secondary_color TEXT NOT NULL DEFAULT '#D69E2E',
    background_color TEXT NOT NULL DEFAULT '#1A202C',
    surface_color   TEXT NOT NULL DEFAULT '#2D3748',
    text_color      TEXT NOT NULL DEFAULT '#E2E8F0',
    accent_color    TEXT NOT NULL DEFAULT '#ED64A6',
    heading_font    TEXT NOT NULL DEFAULT 'Playfair Display',
    body_font       TEXT NOT NULL DEFAULT 'Inter',
    logo_url        TEXT,
    about_photo_url TEXT,
    about_content   TEXT NOT NULL DEFAULT '',
    about_cta_text  TEXT DEFAULT 'Get Started',
    about_cta_url   TEXT DEFAULT '',
    custom_css      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- API KEYS (per-tenant, for Zapier integration)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash        TEXT NOT NULL UNIQUE,
    key_prefix      TEXT NOT NULL,
    label           TEXT NOT NULL DEFAULT 'Default',
    is_active       INTEGER NOT NULL DEFAULT 1,
    last_used_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);

-- ============================================================
-- WEBHOOKS (per-tenant webhook URLs for Zapier)
-- ============================================================
CREATE TABLE IF NOT EXISTS webhooks (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    url             TEXT NOT NULL,
    is_active       INTEGER NOT NULL DEFAULT 1,
    secret          TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_event ON webhooks(tenant_id, event_type);

-- ============================================================
-- CARD SETS
-- ============================================================
CREATE TABLE IF NOT EXISTS card_sets (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    cover_image_url TEXT,
    back_image_url  TEXT,
    is_published    INTEGER NOT NULL DEFAULT 0,
    card_count      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_card_sets_tenant ON card_sets(tenant_id);

-- ============================================================
-- CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
    id              TEXT PRIMARY KEY,
    card_set_id     TEXT NOT NULL REFERENCES card_sets(id) ON DELETE CASCADE,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    image_url       TEXT,
    position        INTEGER NOT NULL DEFAULT 0,
    keywords        TEXT,
    upright_meaning TEXT,
    reversed_meaning TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(card_set_id);
CREATE INDEX IF NOT EXISTS idx_cards_tenant ON cards(tenant_id);

-- ============================================================
-- READING TEMPLATES (defines available reading types)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_templates (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    spread_type     TEXT NOT NULL DEFAULT 'three_card',
    card_count      INTEGER NOT NULL DEFAULT 3,
    position_labels TEXT NOT NULL DEFAULT '["Past","Present","Future"]',
    is_default      INTEGER NOT NULL DEFAULT 0,
    ai_prompt       TEXT,
    is_published    INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reading_templates_tenant ON reading_templates(tenant_id);

-- ============================================================
-- READINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS readings (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_set_id     TEXT NOT NULL REFERENCES card_sets(id),
    template_id     TEXT REFERENCES reading_templates(id),
    spread_type     TEXT NOT NULL DEFAULT 'three_card',
    question        TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_readings_user ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_tenant ON readings(tenant_id);

-- ============================================================
-- READING CARDS (which cards were drawn)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_cards (
    id              TEXT PRIMARY KEY,
    reading_id      TEXT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
    card_id         TEXT NOT NULL REFERENCES cards(id),
    position        INTEGER NOT NULL,
    is_reversed     INTEGER NOT NULL DEFAULT 0,
    position_label  TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reading_cards_reading ON reading_cards(reading_id);

-- ============================================================
-- ONBOARDING QUESTIONS (per-tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_questions (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    question_type   TEXT NOT NULL DEFAULT 'text',
    options         TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_required     INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_onboarding_questions_tenant ON onboarding_questions(tenant_id);

-- ============================================================
-- ONBOARDING RESPONSES (user answers)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_responses (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id     TEXT NOT NULL REFERENCES onboarding_questions(id) ON DELETE CASCADE,
    answer          TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user ON onboarding_responses(user_id);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    TEXT REFERENCES users(id),
    content         TEXT NOT NULL,
    is_read         INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_tenant_sender ON chat_messages(tenant_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_tenant_recipient ON chat_messages(tenant_id, recipient_id);

-- ============================================================
-- WEBHOOK LOG (for debugging)
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_log (
    id              TEXT PRIMARY KEY,
    webhook_id      TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    tenant_id       TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    payload         TEXT NOT NULL,
    response_status INTEGER,
    response_body   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_webhook_log_tenant ON webhook_log(tenant_id);
