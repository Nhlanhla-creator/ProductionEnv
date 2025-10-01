#!/bin/bash

echo "🔍 Finding your EmbeddedCheckout component..."
echo "============================================="

# Navigate to the project root
cd ..

echo "📁 Current directory: $(pwd)"
echo ""

echo "🔍 Searching for EmbeddedCheckout.js files..."
find . -name "EmbeddedCheckout.js" -type f 2>/dev/null

echo ""
echo "🔍 Searching for any files containing 'EmbeddedCheckout'..."
find . -name "*EmbeddedCheckout*" -type f 2>/dev/null

echo ""
echo "🔍 Searching for files containing 'verify-payment-status'..."
grep -r "verify-payment-status" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null

echo ""
echo "📂 Frontend directory structure:"
if [ -d "frontend" ]; then
    echo "✅ Found frontend directory"
    ls -la frontend/ 2>/dev/null || echo "Cannot list frontend contents"
    
    if [ -d "frontend/components" ]; then
        echo "✅ Found frontend/components"
        ls -la frontend/components/ 2>/dev/null || echo "Cannot list components"
    fi
    
    if [ -d "frontend/src" ]; then
        echo "✅ Found frontend/src"
        ls -la frontend/src/ 2>/dev/null || echo "Cannot list src"
    fi
else
    echo "❌ No frontend directory found"
fi

if [ -d "src" ]; then
    echo "✅ Found src directory"
    ls -la src/ 2>/dev/null || echo "Cannot list src contents"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Look at the search results above"
echo "2. Find the EmbeddedCheckout.js file location"
echo "3. Replace its content with the new version"
