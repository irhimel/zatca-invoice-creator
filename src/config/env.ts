/**
 * Environment configuration loader
 * Loads environment variables for the application
 */

interface EnvConfig {
    // Azure SQL Database Configuration
    AZURE_SQL_SERVER: string;
    AZURE_SQL_DATABASE: string;
    AZURE_SQL_USERNAME: string;
    AZURE_SQL_PASSWORD: string;
    AZURE_SQL_PORT: number;

    // Database Configuration
    DB_CONNECTION_TIMEOUT: number;
    DB_REQUEST_TIMEOUT: number;
    DB_RETRY_ATTEMPTS: number;
    DB_RETRY_DELAY: number;

    // Sync Configuration
    SYNC_BATCH_SIZE: number;
    SYNC_INTERVAL: number;
    OFFLINE_RETENTION_DAYS: number;

    // Application Configuration
    NODE_ENV: string;
    VITE_APP_NAME: string;
    VITE_APP_VERSION: string;

    // Security Configuration
    ENCRYPTION_KEY: string;
    JWT_SECRET: string;

    // ZATCA Configuration
    ZATCA_ENVIRONMENT: string;
    ZATCA_API_BASE_URL: string;
}

/**
 * Load environment variables with defaults
 */
export function loadEnvConfig(): EnvConfig {
    return {
        // Azure SQL Database Configuration
        AZURE_SQL_SERVER: process.env.AZURE_SQL_SERVER || 'roman-zatca-server.database.windows.net',
        AZURE_SQL_DATABASE: process.env.AZURE_SQL_DATABASE || 'invoicedb',
        AZURE_SQL_USERNAME: process.env.AZURE_SQL_USERNAME || 'your_username',
        AZURE_SQL_PASSWORD: process.env.AZURE_SQL_PASSWORD || 'your_password',
        AZURE_SQL_PORT: parseInt(process.env.AZURE_SQL_PORT || '1433'),

        // Database Configuration
        DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        DB_REQUEST_TIMEOUT: parseInt(process.env.DB_REQUEST_TIMEOUT || '15000'),
        DB_RETRY_ATTEMPTS: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
        DB_RETRY_DELAY: parseInt(process.env.DB_RETRY_DELAY || '1000'),

        // Sync Configuration
        SYNC_BATCH_SIZE: parseInt(process.env.SYNC_BATCH_SIZE || '50'),
        SYNC_INTERVAL: parseInt(process.env.SYNC_INTERVAL || '300000'),
        OFFLINE_RETENTION_DAYS: parseInt(process.env.OFFLINE_RETENTION_DAYS || '30'),

        // Application Configuration
        NODE_ENV: process.env.NODE_ENV || 'development',
        VITE_APP_NAME: process.env.VITE_APP_NAME || 'ZATCA Invoice Creator',
        VITE_APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',

        // Security Configuration
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_here',
        JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_for_authentication',

        // ZATCA Configuration
        ZATCA_ENVIRONMENT: process.env.ZATCA_ENVIRONMENT || 'sandbox',
        ZATCA_API_BASE_URL: process.env.ZATCA_API_BASE_URL || 'https://gw-fatoora.zatca.gov.sa'
    };
}

/**
 * Validate required environment variables
 */
export function validateEnvConfig(config: EnvConfig): { isValid: boolean; missingVars: string[] } {
    const required = [
        'AZURE_SQL_SERVER',
        'AZURE_SQL_DATABASE',
        'AZURE_SQL_USERNAME',
        'AZURE_SQL_PASSWORD'
    ];

    const missingVars: string[] = [];

    for (const key of required) {
        const value = config[key as keyof EnvConfig];
        if (!value || value === 'your_username' || value === 'your_password') {
            missingVars.push(key);
        }
    }

    return {
        isValid: missingVars.length === 0,
        missingVars
    };
}

export const envConfig = loadEnvConfig();
export default envConfig;
