-- ORCA Database Initialization
-- Extensions: PostGIS, TimescaleDB, pgvector

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Confirm extensions
SELECT extname, extversion FROM pg_extension;
