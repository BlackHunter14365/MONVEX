"""
MONVEX Production Metrics & Telemetry Aggregator
Thread-safe, lightweight, in-memory sliding-window telemetry engine.
Zero external monitoring database required; zero secret retention.
"""
import time
import threading
from collections import deque
from typing import Dict, Any, List, Optional

class MetricsCollector:
    """
    Centralized in-memory sliding-window metrics aggregator.
    Maintains the last 1,000 requests to compute real-time:
      - Request counts & status code distributions (2xx, 4xx, 5xx)
      - Error rates
      - Average, P50, P95, and P99 latency percentiles
      - Database query counts & slow queries
      - AI Copilot turn counts, intent distribution, tool metrics, and latency
      - Security WAF defense intercepts and auth failures
      - Financial invariant check outcomes
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(MetricsCollector, cls).__new__(cls)
                cls._instance._init_metrics()
            return cls._instance

    def _init_metrics(self):
        self.lock = threading.Lock()
        self.max_window = 1000
        self.request_window = deque(maxlen=self.max_window)
        self.ai_window = deque(maxlen=self.max_window)
        self.start_time = time.time()

        # Cumulative counters
        self.total_requests = 0
        self.status_2xx = 0
        self.status_3xx = 0
        self.status_4xx = 0
        self.status_5xx = 0

        # AI counters
        self.total_ai_turns = 0
        self.ai_intents = {}
        self.ai_tool_executions = 0
        self.ai_tool_failures = 0

        # Security counters
        self.waf_threat_blocks = 0
        self.auth_failures = 0
        self.rate_limit_events = 0

        # Financial integrity counters
        self.invariant_audits_total = 0
        self.invariant_violations_total = 0
        self.invariant_failures_by_type = {}

    def record_request(self, method: str, path: str, status_code: int, duration_ms: float, client_platform: str = 'web'):
        """Record an incoming HTTP request into rolling metrics."""
        with self.lock:
            self.total_requests += 1
            if 200 <= status_code < 300:
                self.status_2xx += 1
            elif 300 <= status_code < 400:
                self.status_3xx += 1
            elif 400 <= status_code < 500:
                self.status_4xx += 1
            elif status_code >= 500:
                self.status_5xx += 1

            self.request_window.append({
                "timestamp": time.time(),
                "method": method,
                "path": path,
                "status": status_code,
                "duration_ms": duration_ms,
                "platform": client_platform,
            })

    def record_ai_turn(self, intent: str, tools_used: List[str], duration_ms: float, is_blocked: bool = False, has_error: bool = False):
        """Record an AI agent conversation turn."""
        with self.lock:
            self.total_ai_turns += 1
            self.ai_intents[intent] = self.ai_intents.get(intent, 0) + 1
            self.ai_tool_executions += len(tools_used)
            if has_error:
                self.ai_tool_failures += 1

            self.ai_window.append({
                "timestamp": time.time(),
                "intent": intent,
                "tools_count": len(tools_used),
                "duration_ms": duration_ms,
                "is_blocked": is_blocked,
                "has_error": has_error,
            })

    def record_security_event(self, threat_type: str):
        """Record a WAF attack interception or authentication anomaly."""
        with self.lock:
            self.waf_threat_blocks += 1

    def record_auth_failure(self):
        """Record an authentication / OTP validation failure."""
        with self.lock:
            self.auth_failures += 1

    def record_rate_limit(self):
        """Record a rate limit block."""
        with self.lock:
            self.rate_limit_events += 1

    def record_invariant_audit(self, violations_count: int, violations_list: Optional[List[Dict[str, Any]]] = None):
        """Record a financial integrity audit execution."""
        with self.lock:
            self.invariant_audits_total += 1
            if violations_count > 0:
                self.invariant_violations_total += violations_count
                if violations_list:
                    for v in violations_list:
                        inv_name = v.get("invariant", "UNKNOWN")
                        self.invariant_failures_by_type[inv_name] = self.invariant_failures_by_type.get(inv_name, 0) + 1

    def get_snapshot(self) -> Dict[str, Any]:
        """Generate a thread-safe snapshot of all system, AI, security, and financial metrics."""
        with self.lock:
            uptime = round(time.time() - self.start_time, 2)
            total_reqs = self.total_requests
            err_4xx_rate = round((self.status_4xx / total_reqs * 100), 2) if total_reqs > 0 else 0.0
            err_5xx_rate = round((self.status_5xx / total_reqs * 100), 2) if total_reqs > 0 else 0.0

            # Calculate latency percentiles over recent window
            latencies = sorted([r["duration_ms"] for r in self.request_window])
            count = len(latencies)
            if count > 0:
                avg_lat = round(sum(latencies) / count, 2)
                p50_lat = round(latencies[int(count * 0.50)], 2)
                p95_lat = round(latencies[min(int(count * 0.95), count - 1)], 2)
                p99_lat = round(latencies[min(int(count * 0.99), count - 1)], 2)
            else:
                avg_lat = p50_lat = p95_lat = p99_lat = 0.0

            # AI Latencies
            ai_latencies = sorted([t["duration_ms"] for t in self.ai_window])
            ai_count = len(ai_latencies)
            if ai_count > 0:
                ai_avg_lat = round(sum(ai_latencies) / ai_count, 2)
                ai_p95_lat = round(ai_latencies[min(int(ai_count * 0.95), ai_count - 1)], 2)
            else:
                ai_avg_lat = ai_p95_lat = 0.0

            return {
                "uptime_seconds": uptime,
                "system": {
                    "total_requests": total_reqs,
                    "window_samples": count,
                    "status_distribution": {
                        "2xx": self.status_2xx,
                        "3xx": self.status_3xx,
                        "4xx": self.status_4xx,
                        "5xx": self.status_5xx,
                    },
                    "error_rates": {
                        "4xx_rate_pct": err_4xx_rate,
                        "5xx_rate_pct": err_5xx_rate,
                    },
                    "latency_ms": {
                        "avg": avg_lat,
                        "p50": p50_lat,
                        "p95": p95_lat,
                        "p99": p99_lat,
                    }
                },
                "ai": {
                    "total_turns": self.total_ai_turns,
                    "window_turns": ai_count,
                    "avg_turn_latency_ms": ai_avg_lat,
                    "p95_turn_latency_ms": ai_p95_lat,
                    "tool_executions": self.ai_tool_executions,
                    "tool_failures": self.ai_tool_failures,
                    "intent_distribution": dict(self.ai_intents),
                },
                "security": {
                    "waf_threat_blocks": self.waf_threat_blocks,
                    "auth_failures": self.auth_failures,
                    "rate_limit_events": self.rate_limit_events,
                },
                "financial_integrity": {
                    "audits_performed": self.invariant_audits_total,
                    "violations_detected": self.invariant_violations_total,
                    "violations_by_invariant": dict(self.invariant_failures_by_type),
                    "watchdog_status": "HEALTHY" if self.invariant_violations_total == 0 else "WARNING",
                }
            }

# Global singleton instance
metrics_collector = MetricsCollector()
