#!/bin/bash

# Script to fix common Markdown linting issues across all documentation files

echo "🔧 Fixing Markdown linting issues across all documentation files..."

# List of files to fix
files=(
    "DEPLOY_NOW.md"
    "DEPLOYMENT_GUIDE.md"
    "QA_TESTING_GUIDE.md"
    "NEXT_STEPS_GUIDE.md"
    "PROJECT_SUMMARY.md"
    "WINDOWS_INSTALLATION_GUIDE.md"
    "GITHUB_SETUP.md"
    "FEATURE_IMPLEMENTATION_COMPLETE.md"
    "MACOS_BUILD_COMPLETE.md"
    "MACOS_BUILD_STATUS.md"
    "MACOS_INSTALLATION_GUIDE.md"
    "OPTIMIZATION_COMPLETE.md"
    "SETUP_COMPLETE.md"
    "CREATE_INVOICE_ENHANCEMENTS.md"
    "COMPREHENSIVE_DIAGNOSTIC_REPORT.md"
    "BUSINESS_READINESS_ASSESSMENT.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Processing $file..."
        
        # Create a temporary file for processing
        temp_file=$(mktemp)
        
        # Process the file line by line
        {
            prev_line=""
            prev_prev_line=""
            line_num=0
            
            while IFS= read -r line || [[ -n "$line" ]]; do
                line_num=$((line_num + 1))
                
                # Remove trailing spaces (MD009)
                line=$(echo "$line" | sed 's/[[:space:]]*$//')
                
                # Check if current line is a heading
                if [[ "$line" =~ ^#+[[:space:]] ]]; then
                    # Remove trailing punctuation from headings (MD026)
                    line=$(echo "$line" | sed 's/[:.!?]*$//')
                    
                    # Add blank line before heading if previous line is not blank (MD022)
                    if [[ -n "$prev_line" && ! "$prev_line" =~ ^[[:space:]]*$ ]]; then
                        echo ""
                    fi
                fi
                
                # Check if current line starts a list
                if [[ "$line" =~ ^[[:space:]]*[-*+][[:space:]] ]] || [[ "$line" =~ ^[[:space:]]*[0-9]+\.[[:space:]] ]]; then
                    # Add blank line before list if previous line is not blank (MD032)
                    if [[ -n "$prev_line" && ! "$prev_line" =~ ^[[:space:]]*$ && ! "$prev_line" =~ ^#+[[:space:]] ]]; then
                        echo ""
                    fi
                fi
                
                # Check if current line is a code fence
                if [[ "$line" =~ ^[[:space:]]*```.*$ ]]; then
                    # Add blank line before code fence if previous line is not blank (MD031)
                    if [[ -n "$prev_line" && ! "$prev_line" =~ ^[[:space:]]*$ ]]; then
                        echo ""
                    fi
                fi
                
                # Output the current line
                echo "$line"
                
                # Check if we need to add blank line after heading (MD022)
                if [[ "$prev_line" =~ ^#+[[:space:]] && -n "$line" && ! "$line" =~ ^[[:space:]]*$ ]]; then
                    echo ""
                    echo "$line"
                    continue
                fi
                
                # Check if we need to add blank line after list (MD032)
                if [[ "$prev_line" =~ ^[[:space:]]*[-*+][[:space:]] ]] || [[ "$prev_line" =~ ^[[:space:]]*[0-9]+\.[[:space:]] ]]; then
                    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*$ && ! "$line" =~ ^[[:space:]]*[-*+][[:space:]] && ! "$line" =~ ^[[:space:]]*[0-9]+\.[[:space:]] ]]; then
                        echo ""
                        echo "$line"
                        continue
                    fi
                fi
                
                # Check if we need to add blank line after code fence (MD031)
                if [[ "$prev_line" =~ ^[[:space:]]*```[[:space:]]*$ ]]; then
                    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*$ ]]; then
                        echo ""
                        echo "$line"
                        continue
                    fi
                fi
                
                prev_prev_line="$prev_line"
                prev_line="$line"
                
            done < "$file"
        } > "$temp_file"
        
        # Replace original file with processed version
        mv "$temp_file" "$file"
        
        echo "✅ Fixed $file"
    else
        echo "⚠️  File $file not found, skipping..."
    fi
done

echo "🎉 Markdown linting fixes complete!"
echo "📊 Run 'npm run lint' to verify fixes"
