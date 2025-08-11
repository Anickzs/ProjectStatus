#!/bin/bash

# Project Detail E2E Test Runner
# This script runs comprehensive e2e tests for project detail page features

set -e

echo "🚀 Starting Project Detail E2E Tests"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "playwright.config.ts" ]; then
    echo "❌ Error: playwright.config.ts not found. Please run this script from the e2e-tests directory."
    exit 1
fi

# Set test environment variables
export TEST_MAX_CARDS=${TEST_MAX_CARDS:-2}
export NODE_ENV=test

echo "📊 Test Configuration:"
echo "  - Max cards to test: $TEST_MAX_CARDS"
echo "  - Environment: $NODE_ENV"
echo ""

# Function to run tests with proper error handling
run_tests() {
    local test_file=$1
    local test_name=$2
    
    echo "🧪 Running $test_name..."
    echo "   File: $test_file"
    echo ""
    
    if npx playwright test "$test_file" --reporter=list; then
        echo "✅ $test_name completed successfully"
        echo ""
    else
        echo "❌ $test_name failed"
        echo ""
        return 1
    fi
}

# Function to check if server is running
check_server() {
    echo "🔍 Checking if development server is running..."
    if curl -s http://localhost:8000 > /dev/null 2>&1; then
        echo "✅ Server is running on http://localhost:8000"
        echo ""
    else
        echo "⚠️  Server not detected on http://localhost:8000"
        echo "   Make sure to start the server first:"
        echo "   cd ../web-app && python3 server.py 8000"
        echo ""
        echo "   Or use the start script:"
        echo "   ./start-server.sh"
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Main test execution
main() {
    # Check server status
    check_server
    
    # Run project detail feature tests
    run_tests "e2e-project-detail-features.spec.ts" "Project Detail Features Test Suite"
    
    # Run data population tests
    run_tests "e2e-data-population.spec.ts" "Data Population and Validation Test Suite"
    
    # Run existing project cards tests for completeness
    run_tests "e2e-project-cards.spec.ts" "Project Cards Basic Test Suite"
    
    echo "🎉 All Project Detail E2E Tests Completed!"
    echo "=========================================="
    echo ""
    echo "📋 Test Summary:"
    echo "  ✅ Project Detail Features"
    echo "  ✅ Data Population and Validation"
    echo "  ✅ Project Cards Basic Functionality"
    echo ""
    echo "📊 To view detailed test results:"
    echo "  npx playwright show-report"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Project Detail E2E Test Runner"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --features     Run only feature tests"
        echo "  --data         Run only data population tests"
        echo "  --cards        Run only project cards tests"
        echo "  --all          Run all tests (default)"
        echo ""
        echo "Environment Variables:"
        echo "  TEST_MAX_CARDS Number of project cards to test (default: 2)"
        echo ""
        exit 0
        ;;
    --features)
        check_server
        run_tests "e2e-project-detail-features.spec.ts" "Project Detail Features Test Suite"
        ;;
    --data)
        check_server
        run_tests "e2e-data-population.spec.ts" "Data Population and Validation Test Suite"
        ;;
    --cards)
        check_server
        run_tests "e2e-project-cards.spec.ts" "Project Cards Basic Test Suite"
        ;;
    --all|"")
        main
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
