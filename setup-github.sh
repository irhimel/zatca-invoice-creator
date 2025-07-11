#!/bin/bash

# 🚀 ZATCA Invoice Creator - GitHub Setup Script
# This script helps you connect your local repository to GitHub

echo "🚀 ZATCA Invoice Creator - GitHub Repository Setup"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: This is not a git repository. Please run 'git init' first."
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. Please commit them first."
    git status --short
    exit 1
fi

echo "✅ Git repository is clean and ready"
echo ""

# Get GitHub username and repository name
echo "📝 Please provide your GitHub details:"
read -p "GitHub Username: " github_username
read -p "Repository Name (default: zatca-invoice-creator): " repo_name

# Set default repository name if not provided
if [ -z "$repo_name" ]; then
    repo_name="zatca-invoice-creator"
fi

echo ""
echo "🔗 Repository URL will be: https://github.com/$github_username/$repo_name"
echo ""

# Confirm before proceeding
read -p "Continue with setup? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 0
fi

echo ""
echo "🔧 Setting up GitHub repository..."

# Add remote origin
git remote add origin "https://github.com/$github_username/$repo_name.git"

# Verify remote was added
if git remote -v | grep -q "origin"; then
    echo "✅ Remote origin added successfully"
else
    echo "❌ Failed to add remote origin"
    exit 1
fi

echo ""
echo "📤 Pushing to GitHub..."

# Push to GitHub
if git push -u origin main --tags; then
    echo ""
    echo "🎉 SUCCESS! Repository has been pushed to GitHub"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Visit: https://github.com/$github_username/$repo_name"
    echo "2. Check the GitHub Actions CI/CD pipeline"
    echo "3. Review the README.md on GitHub"
    echo "4. Follow the QA testing guide"
    echo ""
    echo "🚀 Your ZATCA Invoice Creator is now live on GitHub!"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo ""
    echo "🔍 Possible solutions:"
    echo "1. Make sure the repository exists on GitHub:"
    echo "   https://github.com/new"
    echo "2. Check your GitHub authentication (token/SSH)"
    echo "3. Verify the repository name and username"
    echo ""
    echo "💡 You can also push manually:"
    echo "   git push -u origin main --tags"
fi

echo ""
echo "📚 Documentation available:"
echo "- README.md - Project overview"
echo "- DEPLOYMENT_GUIDE.md - Production deployment"
echo "- QA_TESTING_GUIDE.md - Testing procedures"
echo "- NEXT_STEPS_GUIDE.md - Complete next steps"
echo ""
echo "✅ Setup complete!"
