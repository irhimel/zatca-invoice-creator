# Azure SQL Database Integration - Usage Guide

## 🚀 **Setup Instructions**

### 1. Environment Configuration

Update your `.env` file with your Azure SQL Database details:

```env

# Azure SQL Database Configuration

AZURE_SQL_SERVER=roman-zatca-server.database.windows.net
AZURE_SQL_DATABASE=invoicedb
AZURE_SQL_USERNAME=your_username
AZURE_SQL_PASSWORD=your_password
AZURE_SQL_PORT=1433

# Database Configuration

DB_CONNECTION_TIMEOUT=30000
DB_REQUEST_TIMEOUT=15000
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=1000

# Sync Configuration

SYNC_BATCH_SIZE=50
SYNC_INTERVAL=300000
OFFLINE_RETENTION_DAYS=30

```

### 2. Database Schema

The system automatically creates the following tables:

```sql
-- Invoices table
CREATE TABLE invoices (
    id NVARCHAR(50) PRIMARY KEY,
    uuid NVARCHAR(36) UNIQUE NOT NULL,
    invoiceNumber NVARCHAR(100) NOT NULL,
    issueDate DATE NOT NULL,
    issueTime TIME NOT NULL,
    -- ... other ZATCA fields
    syncStatus NVARCHAR(20) DEFAULT 'pending',
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id NVARCHAR(50) PRIMARY KEY,
    invoiceId NVARCHAR(50) NOT NULL,
    action NVARCHAR(20) NOT NULL,
    timestamp DATETIME2 DEFAULT GETDATE(),
    details NVARCHAR(MAX)
);

```

## 💼 **Usage Examples**

### Initialize Database Service

```typescript
import { dbService } from '../services/database';

// Initialize the database service
await dbService.initialize();

```

### Create Invoice (Online/Offline)

```typescript
import { dbService } from '../services/database';
import { ZATCAInvoice } from '../types/zatca';

const invoice: ZATCAInvoice = {
    id: 'INV-001',
    uuid: 'uuid-here',
    // ... other invoice fields
};

// Create invoice (automatically handles online/offline)
const invoiceId = await dbService.createInvoice(invoice);
console.log('Invoice created:', invoiceId);

```

### Get Invoices with Filtering

```typescript
import { dbService } from '../services/database';

// Get all invoices
const allInvoices = await dbService.getInvoices();

// Get invoices with filters
const filteredInvoices = await dbService.getInvoices({
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'signed',
    limit: 10,
    offset: 0,
    orderBy: 'createdAt',
    orderDirection: 'DESC'
});

```

### Update Invoice

```typescript
import { dbService } from '../services/database';

await dbService.updateInvoice('INV-001', {
    status: 'reported',
    reportedAt: new Date().toISOString()
});

```

### Sync Offline Data

```typescript
import { dbService } from '../services/database';

// Manual sync
const syncResult = await dbService.syncOfflineDataToAzure();
console.log('Sync result:', syncResult);

// Sync with progress callback
const syncResult = await dbService.syncOfflineDataToAzure({
    batchSize: 25,
    maxRetries: 3,
    retryDelay: 2000,
    onProgress: (progress) => {
        console.log(`Progress: ${progress.processed}/${progress.total}`);
    },
    onBatchComplete: (batch, result) => {
        console.log(`Batch completed: ${result.syncedCount} synced`);
    }
});

```

### Check Connection Status

```typescript
import { dbService } from '../services/database';

const status = dbService.getConnectionStatus();
console.log('Database Status:', {
    azure: status.azure,        // Azure SQL connected
    online: status.online,      // Network online
    autoSyncActive: status.autoSyncActive,
    offlineCount: status.offlineCount
});

```

## 🔧 **Advanced Features**

### Error Handling

```typescript
import { dbService } from '../services/database';

try {
    await dbService.createInvoice(invoice);
} catch (error) {
    if (error.message.includes('connection')) {
        // Handle connection error - invoice will be stored offline
        console.log('Stored offline for later sync');
    } else {
        // Handle other errors
        console.error('Invoice creation failed:', error);
    }
}

```

### Batch Operations

```typescript
import { AzureSQLService } from '../services/azureSQL';

const azureSQL = AzureSQLService.getInstance();

// Batch create invoices
const invoices = [invoice1, invoice2, invoice3];
for (const invoice of invoices) {
    await azureSQL.createInvoice(invoice);
}

```

### Metrics and Monitoring

```typescript
import { dbService } from '../services/database';

const metrics = await dbService.getMetrics();
console.log('Database Metrics:', {
    totalInvoices: metrics.totalInvoices,
    pendingSyncCount: metrics.pendingSyncCount,
    syncedCount: metrics.syncedCount,
    failedSyncCount: metrics.failedSyncCount,
    averageResponseTime: metrics.averageResponseTime
});

```

## 📊 **React Integration**

### Custom Hook for Database Status

```typescript
import { useState, useEffect } from 'react';
import { dbService } from '../services/database';

export function useDatabase() {
    const [status, setStatus] = useState({
        azure: false,
        online: false,
        autoSyncActive: false,
        offlineCount: 0
    });

    useEffect(() => {
        const updateStatus = async () => {
            const dbStatus = dbService.getConnectionStatus();
            const metrics = await dbService.getMetrics();

            setStatus({
                ...dbStatus,
                offlineCount: metrics.pendingSyncCount
            });
        };

        updateStatus();
        const interval = setInterval(updateStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return {
        status,
        syncNow: () => dbService.syncOfflineDataToAzure(),
        createInvoice: (invoice) => dbService.createInvoice(invoice),
        getInvoices: (filters) => dbService.getInvoices(filters)
    };
}

```

### Usage in Component

```typescript
import React from 'react';
import { useDatabase } from '../hooks/useDatabase';

export function InvoicePanel() {
    const { status, syncNow, createInvoice } = useDatabase();

    return (
        <div>
            <div className="status-panel">
                <div className={`status ${status.azure ? 'connected' : 'disconnected'}`}>
                    Azure SQL: {status.azure ? 'Connected' : 'Disconnected'}
                </div>
                <div className={`status ${status.online ? 'online' : 'offline'}`}>
                    Network: {status.online ? 'Online' : 'Offline'}
                </div>
                {status.offlineCount > 0 && (
                    <button onClick={syncNow}>
                        Sync {status.offlineCount} pending invoices
                    </button>
                )}
            </div>

            {/* Your invoice form here */}
        </div>
    );
}

```

## 🛡️ **Security Best Practices**

1. **Environment Variables**: Store sensitive data in `.env` files
2. **Connection Encryption**: Always use `encrypt: true` for Azure SQL
3. **Input Validation**: Validate all input data before database operations
4. **Audit Logging**: All operations are automatically logged
5. **Error Handling**: Comprehensive error handling and retry logic

## 🔄 **Offline-First Architecture**

The system is designed to work offline-first:

1. **Online**: Data is saved directly to Azure SQL Database
2. **Offline**: Data is stored in IndexedDB and queued for sync
3. **Sync**: Automatic synchronization when connection is restored
4. **Conflict Resolution**: Timestamp-based conflict resolution

## 📈 **Performance Optimization**

- **Connection Pooling**: Reuse database connections
- **Batch Processing**: Sync data in configurable batches
- **Lazy Loading**: Load data only when needed
- **Caching**: Local caching for frequently accessed data
- **Compression**: Compress large JSON fields

## 🚨 **Error Handling**

Common error scenarios and handling:

```typescript
try {
    await dbService.createInvoice(invoice);
} catch (error) {
    switch (error.code) {
        case 'ECONNREFUSED':
            // Database unreachable - store offline
            await offlineSync.storeInvoiceOffline(invoice);
            break;
        case 'ETIMEOUT':
            // Connection timeout - retry with backoff
            await retryWithBackoff(() => dbService.createInvoice(invoice));
            break;
        case 'ENOTFOUND':
            // DNS resolution failed - check configuration
            console.error('Database server not found');
            break;
        default:
            // Other errors
            console.error('Database error:', error);
    }
}

```

This comprehensive Azure SQL Database integration provides a robust, offline-first solution for your ZATCA-compliant invoice application with automatic synchronization and full error handling.
