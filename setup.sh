#!/bin/bash

# ========================================
# ZATCA Invoice Application Setup Script
# ========================================

echo "🚀 Starting ZATCA Invoice Application Setup..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    print_info "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
            print_status "Node.js version is compatible"
        else
            print_error "Node.js version must be 18 or higher. Current: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_info "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing application dependencies..."
    if npm install; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Create environment file
create_env_file() {
    print_info "Creating environment configuration..."
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "Environment file created from template"
            print_warning "Please edit .env file with your actual configuration"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_warning ".env file already exists"
    fi
}

# Generate security keys
generate_keys() {
    print_info "Generating security keys..."
    
    # Generate 32-character encryption key
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 16)
    
    if [ -f .env ]; then
        # Update .env file with generated keys
        sed -i.bak "s/your-32-character-encryption-key-here/$ENCRYPTION_KEY/g" .env
        sed -i.bak "s/your-32-character-jwt-secret-here/$JWT_SECRET/g" .env
        rm .env.bak
        print_status "Security keys generated and updated in .env file"
    else
        print_error ".env file not found"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    print_info "Creating application directories..."
    
    directories=(
        "backups"
        "uploads"
        "temp"
        "logs"
        "exports"
        "certificates"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        else
            print_warning "Directory already exists: $dir"
        fi
    done
}

# Set up database
setup_database() {
    print_info "Database setup instructions:"
    print_warning "Manual database setup required:"
    echo "1. Create Azure SQL Database or SQL Server instance"
    echo "2. Run the database-setup.sql script"
    echo "3. Update database connection in .env file"
    echo "4. Test database connection"
}

# Build application
build_application() {
    print_info "Building application for production..."
    if npm run build; then
        print_status "Application built successfully"
    else
        print_error "Failed to build application"
        exit 1
    fi
}

# Create startup scripts
create_startup_scripts() {
    print_info "Creating startup scripts..."
    
    # Create Windows startup script
    cat > start-windows.bat << 'EOF'
@echo off
echo Starting ZATCA Invoice Application...
npm run electron
pause
EOF
    
    # Create macOS/Linux startup script
    cat > start-unix.sh << 'EOF'
#!/bin/bash
echo "Starting ZATCA Invoice Application..."
npm run electron
EOF
    chmod +x start-unix.sh
    
    print_status "Startup scripts created"
}

# Main setup function
main() {
    echo "🏢 ZATCA Invoice Application Setup"
    echo "=================================="
    echo
    
    # Run all checks and setup steps
    check_nodejs
    check_npm
    install_dependencies
    create_env_file
    
    # Check if openssl is available for key generation
    if command -v openssl &> /dev/null; then
        generate_keys
    else
        print_warning "OpenSSL not found. Please manually generate security keys in .env file"
    fi
    
    create_directories
    build_application
    create_startup_scripts
    setup_database
    
    echo
    echo "🎉 Setup completed successfully!"
    echo "================================"
    echo
    print_info "Next steps:"
    echo "1. Edit the .env file with your configuration"
    echo "2. Set up your database using database-setup.sql"
    echo "3. Configure ZATCA credentials"
    echo "4. Test the application: npm run electron-dev"
    echo "5. Start production: npm run electron"
    echo
    print_status "Your ZATCA Invoice Application is ready!"
}

# Run main function
main
