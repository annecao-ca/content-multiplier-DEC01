import pg from 'pg';

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
        throw new Error('Database not configured');
    }
    const r = await pool.query<T>(text, params); 
    return r.rows; 
}
