#!/bin/bash
set -e

echo "================================================"
echo "  WPCLife Pre-Deployment Test & Build Pipeline"
echo "================================================"
echo ""

echo "[1/3] Installing Playwright browsers (if needed)..."
npx playwright install chromium 2>/dev/null || true

echo ""
echo "[2/3] Running API & Integration tests..."
npx playwright test --reporter=list

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ TESTS FAILED - Deployment aborted!"
    echo "Fix the failing tests before deploying to production."
    exit 1
fi

echo ""
echo "[3/3] Building for production..."
npm run build

echo ""
echo "================================================"
echo "  ✅ All tests passed! Build complete."
echo "================================================"
echo ""
echo "Ready to deploy to production!"
