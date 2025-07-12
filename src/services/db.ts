// Main database service that exports the Azure SQL implementation
export { AzureSQLService } from './azureSQL';
export { DatabaseService, dbService } from './database';
export { OfflineSyncService } from './offlineSync';

// For backward compatibility, export the main database service as default
export { dbService as default } from './database';
