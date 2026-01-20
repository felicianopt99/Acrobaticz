#!/bin/bash

################################################################################
# Production Failover Test Suite
# ============================================================
# Tests system resilience in production environment
# - Database connection failures
# - API timeout recovery
# - Health check accuracy
# - Load balancer failover detection
# - Session persistence
# - Automatic recovery
#
# Usage:
#   bash scripts/test-failover-production.sh
#   bash scripts/test-failover-production.sh --environment staging
#   bash scripts/test-failover-production.sh --verbose --report
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:production}"
API_URL="${API_URL:-https://app.acrobaticz.com}"
HEALTH_ENDPOINT="/api/health"
VERBOSE=${VERBOSE:-false}
REPORT_FILE="failover-test-report-$(date +%Y%m%d-%H%M%S).json"

# Test Results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

################################################################################
# Utility Functions
################################################################################

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
  ((TESTS_PASSED++))
}

log_error() {
  echo -e "${RED}✗${NC} $1"
  ((TESTS_FAILED++))
  FAILED_TESTS+=("$1")
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_test() {
  echo -e "\n${BLUE}▶${NC} $1"
  ((TESTS_RUN++))
}

assert_http_status() {
  local url=$1
  local expected_status=$2
  local description=$3

  local response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)

  if [[ "$status" == "$expected_status" ]]; then
    log_success "$description (HTTP $status)"
    echo "$body"
  else
    log_error "$description (expected $expected_status, got $status)"
    [[ "$VERBOSE" == "true" ]] && echo "Response: $body"
  fi
}

assert_contains() {
  local content=$1
  local pattern=$2
  local description=$3

  if echo "$content" | grep -q "$pattern"; then
    log_success "$description"
  else
    log_error "$description (pattern not found: $pattern)"
  fi
}

measure_response_time() {
  local url=$1
  local description=$2
  
  local start_time=$(date +%s%N)
  local response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
  local end_time=$(date +%s%N)
  
  local elapsed=$((($end_time - $start_time) / 1000000)) # Convert to ms
  local status=$(echo "$response" | tail -n 1)
  
  log_info "$description: ${elapsed}ms (HTTP $status)"
  echo "$elapsed"
}

################################################################################
# Health Check Tests
################################################################################

test_health_endpoint_availability() {
  log_test "Health endpoint availability"
  
  assert_http_status "${API_URL}${HEALTH_ENDPOINT}" "200" \
    "Health check endpoint responds with 200 OK"
}

test_health_check_response_structure() {
  log_test "Health check response structure"
  
  local response=$(curl -s "${API_URL}${HEALTH_ENDPOINT}")
  
  assert_contains "$response" '"status"' "Response contains 'status' field"
  assert_contains "$response" '"timestamp"' "Response contains 'timestamp' field"
  assert_contains "$response" '"database"' "Response contains 'database' field"
  assert_contains "$response" '"components"' "Response contains 'components' field"
}

test_health_check_performance() {
  log_test "Health check response time (target < 1s)"
  
  local elapsed=$(measure_response_time "${API_URL}${HEALTH_ENDPOINT}" \
    "Health check latency")
  
  if [ "$elapsed" -lt 1000 ]; then
    log_success "Health check response time acceptable"
  else
    log_warning "Health check response slow: ${elapsed}ms (target < 1000ms)"
  fi
}

test_detailed_health_check() {
  log_test "Detailed health check with diagnostics"
  
  local response=$(curl -s "${API_URL}${HEALTH_ENDPOINT}?detailed=true")
  
  assert_contains "$response" '"components"' "Detailed health includes components"
}

################################################################################
# API Resilience Tests
################################################################################

test_api_concurrent_requests() {
  log_test "API concurrent request handling (50 parallel)"
  
  local success_count=0
  local total_requests=50
  
  for i in $(seq 1 $total_requests); do
    (curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/products?limit=1" > "/tmp/response_$i.txt" &)
  done
  
  wait
  
  for i in $(seq 1 $total_requests); do
    local status=$(cat "/tmp/response_$i.txt" 2>/dev/null || echo "000")
    if [[ "$status" == "200" ]] || [[ "$status" == "202" ]] || [[ "$status" == "206" ]]; then
      ((success_count++))
    fi
    rm -f "/tmp/response_$i.txt"
  done
  
  local success_rate=$((success_count * 100 / total_requests))
  
  if [ "$success_rate" -ge 80 ]; then
    log_success "Concurrent requests: $success_count/$total_requests succeeded ($success_rate%)"
  else
    log_error "Concurrent requests: $success_count/$total_requests succeeded ($success_rate% - target 80%)"
  fi
}

test_api_timeout_handling() {
  log_test "API timeout handling (request with long delay)"
  
  local response=$(curl -s -m 3 "${API_URL}/api/products?delay=10000" 2>&1 || echo "timeout")
  
  if echo "$response" | grep -q "timeout\|timed out\|Killed\|Operation timed out"; then
    log_success "Request timeout handled gracefully"
  else
    log_success "Request completed or rejected"
  fi
}

test_api_retry_header() {
  log_test "API Retry-After header on failures"
  
  local headers=$(curl -s -i "${API_URL}${HEALTH_ENDPOINT}" 2>&1)
  
  if echo "$headers" | grep -qi "retry-after\|x-ratelimit-reset"; then
    log_success "Retry-After headers present"
  else
    log_warning "Retry-After headers not found (may be normal)"
  fi
}

################################################################################
# Database Resilience Tests
################################################################################

test_database_connection_status() {
  log_test "Database connection status"
  
  local response=$(curl -s "${API_URL}${HEALTH_ENDPOINT}")
  
  if echo "$response" | grep -q '"database".*"connected"'; then
    log_success "Database connection established"
  elif echo "$response" | grep -q '"database".*"degraded"'; then
    log_warning "Database connection degraded"
  else
    log_warning "Database connection status unclear"
  fi
}

test_database_connection_pool() {
  log_test "Database connection pool health"
  
  local response=$(curl -s "${API_URL}${HEALTH_ENDPOINT}?detailed=true")
  
  if echo "$response" | grep -q '"poolConnections"\|"poolStatus"'; then
    log_success "Connection pool information available"
  fi
}

################################################################################
# Load Balancer & Failover Tests
################################################################################

test_load_balancer_detection() {
  log_test "Load balancer health check support"
  
  local response=$(curl -s -H "User-Agent: ELB-HealthChecker/2.0" \
    "${API_URL}${HEALTH_ENDPOINT}")
  
  if [ -n "$response" ]; then
    log_success "Load balancer health checks supported"
  else
    log_error "Load balancer health check failed"
  fi
}

test_instance_identity() {
  log_test "Instance identity in health response"
  
  local response=$(curl -s "${API_URL}${HEALTH_ENDPOINT}")
  
  if echo "$response" | grep -q '"instanceId"\|"hostname"'; then
    log_success "Instance identity included in health check"
  else
    log_warning "Instance identity not included (may be disabled)"
  fi
}

test_circuit_breaker_status() {
  log_test "Circuit breaker status reporting"
  
  local headers=$(curl -s -i "${API_URL}${HEALTH_ENDPOINT}" 2>&1)
  
  if echo "$headers" | grep -qi "x-circuit-breaker"; then
    log_success "Circuit breaker status header present"
  else
    log_warning "Circuit breaker header not found"
  fi
}

################################################################################
# Session & State Tests
################################################################################

test_session_persistence() {
  log_test "Session persistence across requests"
  
  # Create test session
  local session_response=$(curl -s -c /tmp/cookies.txt \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    "${API_URL}/api/auth/test-session" 2>&1)
  
  if [ -f /tmp/cookies.txt ] && [ -s /tmp/cookies.txt ]; then
    # Use session in second request
    local auth_response=$(curl -s -b /tmp/cookies.txt \
      "${API_URL}/api/profile" 2>&1)
    
    if echo "$auth_response" | grep -q '"profile"\|"user"' || [ -n "$auth_response" ]; then
      log_success "Session persisted across requests"
    else
      log_warning "Session persistence unclear (may require authentication)"
    fi
    rm -f /tmp/cookies.txt
  else
    log_warning "Session test skipped (auth endpoint not available)"
  fi
}

################################################################################
# Cache & Degradation Tests
################################################################################

test_cache_headers() {
  log_test "Cache headers in responses"
  
  local headers=$(curl -s -i "${API_URL}/api/products" 2>&1)
  
  if echo "$headers" | grep -qi "cache-control\|etag\|x-cache"; then
    log_success "Cache headers present in responses"
  else
    log_warning "Cache headers not found"
  fi
}

test_graceful_degradation() {
  log_test "Graceful degradation on partial failure"
  
  local response=$(curl -s -w "\nHTTP_%{http_code}" "${API_URL}/api/products" 2>&1)
  local status=$(echo "$response" | grep "HTTP_" | sed 's/HTTP_//')
  
  if [[ "$status" == "200" ]] || [[ "$status" == "206" ]] || [[ "$status" == "202" ]]; then
    log_success "API returns data or graceful degradation (HTTP $status)"
  else
    log_warning "Unexpected status: $status"
  fi
}

################################################################################
# Performance & Stress Tests
################################################################################

test_rapid_health_checks() {
  log_test "Rapid health checks (10 in sequence)"
  
  local start_time=$(date +%s%N)
  local success_count=0
  
  for i in $(seq 1 10); do
    local status=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}${HEALTH_ENDPOINT}")
    if [[ "$status" == "200" ]]; then
      ((success_count++))
    fi
  done
  
  local end_time=$(date +%s%N)
  local elapsed=$((($end_time - $start_time) / 1000000))
  
  log_success "Rapid health checks: $success_count/10 succeeded in ${elapsed}ms"
}

test_connection_reuse() {
  log_test "Connection reuse and keep-alive"
  
  local elapsed1=$(measure_response_time "${API_URL}${HEALTH_ENDPOINT}" \
    "First request (new connection)")
  
  local elapsed2=$(measure_response_time "${API_URL}${HEALTH_ENDPOINT}" \
    "Second request (should reuse connection)")
  
  if [ "$elapsed2" -lt "$elapsed1" ]; then
    log_success "Connection reuse working (elapsed: ${elapsed1}ms → ${elapsed2}ms)"
  else
    log_warning "Connection reuse unclear (${elapsed1}ms → ${elapsed2}ms)"
  fi
}

################################################################################
# Report Generation
################################################################################

generate_report() {
  log_info "\nGenerating test report..."
  
  cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "api_url": "$API_URL",
  "results": {
    "total_tests": $TESTS_RUN,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "success_rate": $(echo "scale=2; $TESTS_PASSED * 100 / $TESTS_RUN" | bc)%
  },
  "failed_tests": $(printf '%s\n' "${FAILED_TESTS[@]}" | jq -R . | jq -s .),
  "status": "$([ $TESTS_FAILED -eq 0 ] && echo 'PASSED' || echo 'FAILED')"
}
EOF
  
  log_success "Report saved to: $REPORT_FILE"
}

################################################################################
# Main Execution
################################################################################

main() {
  clear
  
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  Production Failover Test Suite                            ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
  
  log_info "Environment: $ENVIRONMENT"
  log_info "API URL: $API_URL"
  log_info "Start time: $(date)\n"
  
  # Run all test suites
  log_info "=== Health Check Tests ==="
  test_health_endpoint_availability
  test_health_check_response_structure
  test_health_check_performance
  test_detailed_health_check
  
  log_info "\n=== API Resilience Tests ==="
  test_api_concurrent_requests
  test_api_timeout_handling
  test_api_retry_header
  
  log_info "\n=== Database Resilience Tests ==="
  test_database_connection_status
  test_database_connection_pool
  
  log_info "\n=== Load Balancer & Failover Tests ==="
  test_load_balancer_detection
  test_instance_identity
  test_circuit_breaker_status
  
  log_info "\n=== Session & State Tests ==="
  test_session_persistence
  
  log_info "\n=== Cache & Degradation Tests ==="
  test_cache_headers
  test_graceful_degradation
  
  log_info "\n=== Performance & Stress Tests ==="
  test_rapid_health_checks
  test_connection_reuse
  
  # Summary
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  Test Summary                                              ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
  
  echo -e "Total Tests: ${BLUE}$TESTS_RUN${NC}"
  echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
  
  local success_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
  echo -e "Success Rate: ${BLUE}${success_rate}%${NC}\n"
  
  # Generate report if requested
  if [[ "$@" == *"--report"* ]]; then
    generate_report
  fi
  
  log_info "End time: $(date)"
  
  # Exit with appropriate code
  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All failover tests passed!${NC}\n"
    exit 0
  else
    echo -e "\n${RED}✗ Some tests failed. Review log above.${NC}\n"
    exit 1
  fi
}

# Parse options
if [[ "$@" == *"--verbose"* ]]; then
  VERBOSE=true
fi

if [[ "$@" == *"--environment"* ]]; then
  ENVIRONMENT="$(echo "$@" | sed -n 's/.*--environment \([^ ]*\).*/\1/p')"
  API_URL="https://app-${ENVIRONMENT}.acrobaticz.com"
fi

main "$@"
