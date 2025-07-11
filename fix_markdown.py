#!/usr/bin/env python3
"""
Simple script to fix common Markdown linting issues
"""

import re
import os
import glob

def fix_markdown_file(filepath):
    """Fix common markdown linting issues in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        fixed_lines = []
        
        for i, line in enumerate(lines):
            # Remove trailing spaces (MD009)
            line = line.rstrip()
            
            # Fix heading punctuation (MD026)
            if re.match(r'^#+\s', line):
                line = re.sub(r'[:.!?]+$', '', line)
            
            # Check if we need blank line before this line
            prev_line = lines[i-1] if i > 0 else ""
            next_line = lines[i+1] if i < len(lines)-1 else ""
            
            # Add blank line before heading (MD022)
            if (re.match(r'^#+\s', line) and 
                prev_line.strip() != "" and 
                not re.match(r'^#+\s', prev_line)):
                if fixed_lines and fixed_lines[-1].strip() != "":
                    fixed_lines.append("")
            
            # Add blank line before list (MD032)
            if (re.match(r'^\s*[-*+]\s', line) and 
                prev_line.strip() != "" and 
                not re.match(r'^\s*[-*+]\s', prev_line) and
                not re.match(r'^#+\s', prev_line)):
                if fixed_lines and fixed_lines[-1].strip() != "":
                    fixed_lines.append("")
            
            # Add blank line before code fence (MD031)
            if (re.match(r'^\s*```', line) and 
                prev_line.strip() != "" and
                not re.match(r'^\s*```', prev_line)):
                if fixed_lines and fixed_lines[-1].strip() != "":
                    fixed_lines.append("")
            
            fixed_lines.append(line)
            
            # Add blank line after heading (MD022)
            if (re.match(r'^#+\s', line) and 
                next_line.strip() != "" and 
                not re.match(r'^#+\s', next_line) and
                next_line.strip() != ""):
                fixed_lines.append("")
            
            # Add blank line after list (MD032)  
            if (re.match(r'^\s*[-*+]\s', line) and 
                next_line.strip() != "" and
                not re.match(r'^\s*[-*+]\s', next_line) and
                next_line.strip() != ""):
                fixed_lines.append("")
            
            # Add blank line after code fence (MD031)
            if (re.match(r'^\s*```\s*$', line) and 
                next_line.strip() != "" and
                not re.match(r'^\s*```', next_line)):
                fixed_lines.append("")
        
        # Join lines and clean up multiple blank lines
        fixed_content = '\n'.join(fixed_lines)
        fixed_content = re.sub(r'\n{3,}', '\n\n', fixed_content)
        
        # Only write if content changed
        if fixed_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ Fixed {filepath}")
            return True
        else:
            print(f"✨ {filepath} already clean")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    print("🔧 Fixing Markdown linting issues...")
    
    # Get all markdown files
    md_files = glob.glob("*.md")
    
    fixed_count = 0
    for filepath in md_files:
        if fix_markdown_file(filepath):
            fixed_count += 1
    
    print(f"🎉 Fixed {fixed_count} files!")
    print("📊 Run linting to verify fixes")

if __name__ == "__main__":
    main()
