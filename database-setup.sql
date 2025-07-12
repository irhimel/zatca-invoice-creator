-- ========================================
-- ZATCA Invoice Application Database Schema
-- SQL Server / Azure SQL Database
-- ========================================

-- Create database (if not exists)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'InvoiceDB')
BEGIN
    CREATE DATABASE InvoiceDB;
END;
GO

USE InvoiceDB;
GO

-- ========================================
-- 1. COMPANIES TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Companies' AND xtype='U')
BEGIN
    CREATE TABLE Companies (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        name_ar NVARCHAR(255),
        vat_number NVARCHAR(15) NOT NULL UNIQUE,
        cr_number NVARCHAR(20),
        address NVARCHAR(500),
        address_ar NVARCHAR(500),
        city NVARCHAR(100),
        postal_code NVARCHAR(10),
        phone NVARCHAR(20),
        email NVARCHAR(255),
        logo_url NVARCHAR(500),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        is_active BIT DEFAULT 1
    );
END;
GO

-- ========================================
-- 2. CLIENTS TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clients' AND xtype='U')
BEGIN
    CREATE TABLE Clients (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER REFERENCES Companies(id),
        name NVARCHAR(255) NOT NULL,
        name_ar NVARCHAR(255),
        vat_number NVARCHAR(15),
        cr_number NVARCHAR(20),
        contact_person NVARCHAR(255),
        phone NVARCHAR(20),
        email NVARCHAR(255),
        address NVARCHAR(500),
        city NVARCHAR(100),
        postal_code NVARCHAR(10),
        payment_terms INT DEFAULT 30,
        credit_limit DECIMAL(15,2) DEFAULT 0,
        currency NVARCHAR(3) DEFAULT 'SAR',
        notes NVARCHAR(1000),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        is_active BIT DEFAULT 1
    );
END;
GO

-- ========================================
-- 3. INVOICES TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' AND xtype='U')
BEGIN
    CREATE TABLE Invoices (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER REFERENCES Companies(id),
        client_id UNIQUEIDENTIFIER REFERENCES Clients(id),
        invoice_number NVARCHAR(50) NOT NULL,
        invoice_type NVARCHAR(20) DEFAULT 'simplified', -- simplified, standard
        issue_date DATE NOT NULL,
        due_date DATE,
        supply_date DATE,
        currency NVARCHAR(3) DEFAULT 'SAR',
        subtotal DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        notes NVARCHAR(1000),
        zatca_uuid NVARCHAR(100),
        zatca_hash NVARCHAR(100),
        zatca_qr_code NVARCHAR(1000),
        zatca_status NVARCHAR(20) DEFAULT 'pending', -- pending, submitted, approved, rejected
        zatca_submission_date DATETIME2,
        zatca_response NVARCHAR(MAX),
        pdf_path NVARCHAR(500),
        xml_content NVARCHAR(MAX),
        status NVARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, cancelled
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        
        UNIQUE(company_id, invoice_number)
    );
END;
GO

-- ========================================
-- 4. INVOICE ITEMS TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InvoiceItems' AND xtype='U')
BEGIN
    CREATE TABLE InvoiceItems (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        invoice_id UNIQUEIDENTIFIER REFERENCES Invoices(id) ON DELETE CASCADE,
        line_number INT NOT NULL,
        description NVARCHAR(500) NOT NULL,
        description_ar NVARCHAR(500),
        quantity DECIMAL(10,3) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 15.00,
        tax_amount DECIMAL(15,2) NOT NULL,
        line_total DECIMAL(15,2) NOT NULL,
        product_code NVARCHAR(50),
        unit_of_measure NVARCHAR(10) DEFAULT 'PCE',
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
END;
GO

-- ========================================
-- 5. QUOTES TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Quotes' AND xtype='U')
BEGIN
    CREATE TABLE Quotes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER REFERENCES Companies(id),
        client_id UNIQUEIDENTIFIER REFERENCES Clients(id),
        quote_number NVARCHAR(50) NOT NULL,
        issue_date DATE NOT NULL,
        valid_until DATE NOT NULL,
        currency NVARCHAR(3) DEFAULT 'SAR',
        subtotal DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        notes NVARCHAR(1000),
        terms_conditions NVARCHAR(2000),
        status NVARCHAR(20) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired, converted
        converted_invoice_id UNIQUEIDENTIFIER REFERENCES Invoices(id),
        pdf_path NVARCHAR(500),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        
        UNIQUE(company_id, quote_number)
    );
END;
GO

-- ========================================
-- 6. QUOTE ITEMS TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QuoteItems' AND xtype='U')
BEGIN
    CREATE TABLE QuoteItems (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        quote_id UNIQUEIDENTIFIER REFERENCES Quotes(id) ON DELETE CASCADE,
        line_number INT NOT NULL,
        description NVARCHAR(500) NOT NULL,
        description_ar NVARCHAR(500),
        quantity DECIMAL(10,3) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 15.00,
        tax_amount DECIMAL(15,2) NOT NULL,
        line_total DECIMAL(15,2) NOT NULL,
        product_code NVARCHAR(50),
        unit_of_measure NVARCHAR(10) DEFAULT 'PCE',
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
END;
GO

-- ========================================
-- 7. TEMPLATES TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Templates' AND xtype='U')
BEGIN
    CREATE TABLE Templates (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER REFERENCES Companies(id),
        name NVARCHAR(255) NOT NULL,
        type NVARCHAR(20) NOT NULL, -- invoice, quote
        template_data NVARCHAR(MAX) NOT NULL, -- JSON data
        is_default BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
END;
GO

-- ========================================
-- 8. AUDIT LOG TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLog' AND xtype='U')
BEGIN
    CREATE TABLE AuditLog (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER REFERENCES Companies(id),
        table_name NVARCHAR(50) NOT NULL,
        record_id UNIQUEIDENTIFIER NOT NULL,
        action NVARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
        old_values NVARCHAR(MAX),
        new_values NVARCHAR(MAX),
        user_id NVARCHAR(100),
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(500),
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
END;
GO

-- ========================================
-- 9. SYNC QUEUE TABLE (for offline support)
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SyncQueue' AND xtype='U')
BEGIN
    CREATE TABLE SyncQueue (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER REFERENCES Companies(id),
        table_name NVARCHAR(50) NOT NULL,
        record_id UNIQUEIDENTIFIER NOT NULL,
        operation NVARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
        data_snapshot NVARCHAR(MAX),
        retry_count INT DEFAULT 0,
        max_retries INT DEFAULT 3,
        next_retry_at DATETIME2,
        status NVARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
        error_message NVARCHAR(1000),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        processed_at DATETIME2
    );
END;
GO

-- ========================================
-- 10. SETTINGS TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Settings' AND xtype='U')
BEGIN
    CREATE TABLE Settings (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER REFERENCES Companies(id),
        setting_key NVARCHAR(100) NOT NULL,
        setting_value NVARCHAR(MAX),
        setting_type NVARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
        is_encrypted BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        
        UNIQUE(company_id, setting_key)
    );
END;
GO

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Clients indexes
CREATE NONCLUSTERED INDEX IX_Clients_CompanyId ON Clients(company_id);
CREATE NONCLUSTERED INDEX IX_Clients_VatNumber ON Clients(vat_number);
CREATE NONCLUSTERED INDEX IX_Clients_Email ON Clients(email);

-- Invoices indexes
CREATE NONCLUSTERED INDEX IX_Invoices_CompanyId ON Invoices(company_id);
CREATE NONCLUSTERED INDEX IX_Invoices_ClientId ON Invoices(client_id);
CREATE NONCLUSTERED INDEX IX_Invoices_InvoiceNumber ON Invoices(invoice_number);
CREATE NONCLUSTERED INDEX IX_Invoices_IssueDate ON Invoices(issue_date);
CREATE NONCLUSTERED INDEX IX_Invoices_Status ON Invoices(status);
CREATE NONCLUSTERED INDEX IX_Invoices_ZatcaStatus ON Invoices(zatca_status);

-- Invoice Items indexes
CREATE NONCLUSTERED INDEX IX_InvoiceItems_InvoiceId ON InvoiceItems(invoice_id);

-- Quotes indexes
CREATE NONCLUSTERED INDEX IX_Quotes_CompanyId ON Quotes(company_id);
CREATE NONCLUSTERED INDEX IX_Quotes_ClientId ON Quotes(client_id);
CREATE NONCLUSTERED INDEX IX_Quotes_QuoteNumber ON Quotes(quote_number);
CREATE NONCLUSTERED INDEX IX_Quotes_IssueDate ON Quotes(issue_date);
CREATE NONCLUSTERED INDEX IX_Quotes_Status ON Quotes(status);

-- Quote Items indexes
CREATE NONCLUSTERED INDEX IX_QuoteItems_QuoteId ON QuoteItems(quote_id);

-- Audit Log indexes
CREATE NONCLUSTERED INDEX IX_AuditLog_CompanyId ON AuditLog(company_id);
CREATE NONCLUSTERED INDEX IX_AuditLog_TableName ON AuditLog(table_name);
CREATE NONCLUSTERED INDEX IX_AuditLog_RecordId ON AuditLog(record_id);
CREATE NONCLUSTERED INDEX IX_AuditLog_CreatedAt ON AuditLog(created_at);

-- Sync Queue indexes
CREATE NONCLUSTERED INDEX IX_SyncQueue_CompanyId ON SyncQueue(company_id);
CREATE NONCLUSTERED INDEX IX_SyncQueue_Status ON SyncQueue(status);
CREATE NONCLUSTERED INDEX IX_SyncQueue_NextRetryAt ON SyncQueue(next_retry_at);

-- Settings indexes
CREATE NONCLUSTERED INDEX IX_Settings_CompanyId ON Settings(company_id);
CREATE NONCLUSTERED INDEX IX_Settings_SettingKey ON Settings(setting_key);

-- ========================================
-- INSERT DEFAULT COMPANY DATA
-- ========================================
IF NOT EXISTS (SELECT * FROM Companies WHERE vat_number = '300000000000003')
BEGIN
    INSERT INTO Companies (
        name, 
        name_ar, 
        vat_number, 
        cr_number,
        address,
        address_ar,
        city,
        postal_code,
        phone,
        email
    ) VALUES (
        'Your Company Name',
        'اسم شركتك',
        '300000000000003',
        '1010000000',
        'Your Business Address',
        'عنوان شركتك',
        'Riyadh',
        '12345',
        '+966500000000',
        'info@yourcompany.com'
    );
END;
GO

-- ========================================
-- INSERT DEFAULT SETTINGS
-- ========================================
DECLARE @CompanyId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM Companies WHERE vat_number = '300000000000003');

IF @CompanyId IS NOT NULL
BEGIN
    -- Default application settings
    INSERT INTO Settings (company_id, setting_key, setting_value, setting_type) VALUES
    (@CompanyId, 'default_vat_rate', '15.00', 'number'),
    (@CompanyId, 'default_currency', 'SAR', 'string'),
    (@CompanyId, 'invoice_prefix', 'INV', 'string'),
    (@CompanyId, 'quote_prefix', 'QUO', 'string'),
    (@CompanyId, 'auto_generate_numbers', 'true', 'boolean'),
    (@CompanyId, 'default_due_days', '30', 'number'),
    (@CompanyId, 'default_language', 'en', 'string'),
    (@CompanyId, 'zatca_environment', 'sandbox', 'string'),
    (@CompanyId, 'auto_backup_enabled', 'true', 'boolean'),
    (@CompanyId, 'sync_interval_minutes', '5', 'number');
END;
GO

-- ========================================
-- CREATE STORED PROCEDURES
-- ========================================

-- Procedure to get dashboard statistics
CREATE OR ALTER PROCEDURE GetDashboardStats
    @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM Invoices WHERE company_id = @CompanyId AND status != 'cancelled') as TotalInvoices,
        (SELECT COUNT(*) FROM Invoices WHERE company_id = @CompanyId AND status = 'draft') as DraftInvoices,
        (SELECT COUNT(*) FROM Invoices WHERE company_id = @CompanyId AND status = 'sent') as SentInvoices,
        (SELECT COUNT(*) FROM Invoices WHERE company_id = @CompanyId AND status = 'paid') as PaidInvoices,
        (SELECT COUNT(*) FROM Clients WHERE company_id = @CompanyId AND is_active = 1) as TotalClients,
        (SELECT COUNT(*) FROM Quotes WHERE company_id = @CompanyId AND status != 'expired') as ActiveQuotes,
        (SELECT ISNULL(SUM(total_amount), 0) FROM Invoices WHERE company_id = @CompanyId AND status = 'paid' AND YEAR(issue_date) = YEAR(GETDATE())) as YearlyRevenue,
        (SELECT ISNULL(SUM(total_amount), 0) FROM Invoices WHERE company_id = @CompanyId AND status = 'paid' AND MONTH(issue_date) = MONTH(GETDATE()) AND YEAR(issue_date) = YEAR(GETDATE())) as MonthlyRevenue;
END;
GO

-- Procedure to clean up old audit logs
CREATE OR ALTER PROCEDURE CleanupAuditLogs
    @RetentionDays INT = 90
AS
BEGIN
    DELETE FROM AuditLog 
    WHERE created_at < DATEADD(DAY, -@RetentionDays, GETUTCDATE());
    
    SELECT @@ROWCOUNT as DeletedRecords;
END;
GO

PRINT 'Database schema created successfully!';
PRINT 'Next steps:';
PRINT '1. Update the default company information in the Companies table';
PRINT '2. Configure your application connection string';
PRINT '3. Test the database connection from your application';
GO
