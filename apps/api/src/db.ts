import pg from 'pg';
import { config } from 'dotenv';

// Load .env files - dotenv will automatically look in current directory
config();  // Load from apps/api/.env (when run from apps/api directory)

// Create pool with graceful error handling
const connectionString = process.env.DATABASE_URL;
let pool: pg.Pool | null = null;

if (connectionString) {
    pool = new pg.Pool({ connectionString });
} else {
    console.warn('DATABASE_URL not provided. Database operations will fail.');
}

export { pool };

export async function q<T = any>(text: string, params: any[] = []) { 
    if (!pool) {
        const error = new Error('Database not configured. Please set DATABASE_URL in .env file.');
        (error as any).code = 'DB_NOT_CONFIGURED';
        throw error;
    }
    try {
        const r = await pool.query<T>(text, params); 
        return r.rows;
    } catch (error: any) {
        // Log database errors for debugging
        console.error('[DB] Query failed:', {
            query: text.substring(0, 100),
            error: error.message,
            code: error.code
        });
        throw error;
    }
}
