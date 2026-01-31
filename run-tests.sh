#!/bin/bash

echo "=== WPCLife End-to-End Test Suite ==="
echo ""

echo "Installing Playwright browsers..."
npx playwright install chromium 2>/dev/null || true

echo ""
echo "Running tests..."
npx playwright test --reporter=list

echo ""
echo "Tests completed!"
echo ""
echo "To run with HTML report: npx playwright test --reporter=html"
echo "To view report: npx playwright show-report"
