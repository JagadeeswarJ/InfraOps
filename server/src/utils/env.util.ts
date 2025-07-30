import dotenv from 'dotenv';
dotenv.config();

export const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || '',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
}