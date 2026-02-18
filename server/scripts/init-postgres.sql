CREATE TABLE IF NOT EXISTS endpoint_metrics (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(24) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    time_bucket TIMESTAMP NOT NULL,
    total_hits INTEGER DEFAULT 0,
    error_hits INTEGER DEFAULT 0,
    avg_latency NUMERIC(10,3) DEFAULT 0.000,
    min_latency NUMERIC(10,3) DEFAULT 0.000,
    max_latency NUMERIC(10,3) DEFAULT 0.000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(client_id, service_name, endpoint, method, time_bucket) -- Inseert | Update
);

-- 10:25 => 1 req (Time Roundoff) [10:00        11:00]

CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_client_id ON endpoint_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_service ON endpoint_metrics(client_id, service_name);
CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_time ON endpoint_metrics(time_bucket);
CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_endpoint ON endpoint_metrics(client_id, service_name, endpoint);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_endpoint_metrics_updated_at ON endpoint_metrics;
CREATE TRIGGER update_endpoint_metrics_updated_at BEFORE UPDATE ON endpoint_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();