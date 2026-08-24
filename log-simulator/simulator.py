import argparse
import json
import os
import random
import sys
import time
from typing import Any, Dict, List
import requests

# Ensure script directory is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aws_generator import AWSLogGenerator
from cctv_generator import CCTVLogGenerator
from firewall_generator import FirewallLogGenerator
from server_generator import ServerLogGenerator
from switch_generator import SwitchLogGenerator
from attack_scenarios import AttackScenarioInjector


def get_random_log(source_filter: str = "all") -> Dict[str, Any]:
    generators = {
        "aws": AWSLogGenerator.generate_log,
        "firewall": FirewallLogGenerator.generate_log,
        "switch": SwitchLogGenerator.generate_log,
        "cctv": CCTVLogGenerator.generate_log,
        "server": ServerLogGenerator.generate_log,
    }

    if source_filter != "all" and source_filter in generators:
        return generators[source_filter]()

    chosen_source = random.choice(list(generators.keys()))
    return generators[chosen_source]()


def send_logs(api_url: str, logs: List[Dict[str, Any]], dry_run: bool = False):
    if dry_run:
        print(json.dumps(logs if len(logs) > 1 else logs[0], indent=2))
        return

    try:
        resp = requests.post(api_url, json=logs, timeout=5)
        if resp.status_code == 200:
            result = resp.json()
            alerts = result.get("alerts_triggered", 0)
            count = result.get("ingested_count", len(logs))
            alert_str = f" [! {alerts} ALERTS TRIGGERED !]" if alerts > 0 else ""
            print(f"[OK] Ingested {count} logs successfully.{alert_str}")
        else:
            print(f"[ERROR] API responded with status {resp.status_code}: {resp.text}")
    except requests.RequestException as e:
        print(f"[CONNECTION FAILED] Could not reach LogIntel at {api_url}: {e}")


def run_scenario(api_url: str, scenario_name: str, dry_run: bool = False):
    scenarios = {
        "bruteforce": ("SSH/LDAP Brute Force Attack", AttackScenarioInjector.generate_brute_force),
        "portscan": ("Network Port Scan Reconnaissance", AttackScenarioInjector.generate_port_scan),
        "flood": ("Firewall Traffic / Blocked Connection Flood", AttackScenarioInjector.generate_blocked_flood),
        "cctv": ("Physical CCTV Lens Tampering & Disconnect", AttackScenarioInjector.generate_cctv_sabotage),
        "aws": ("AWS Cloud Unauthorized Privilege Escalation", AttackScenarioInjector.generate_aws_cloud_threat),
    }

    if scenario_name == "all":
        print("=== Injecting All Cyber Threat Scenarios ===")
        for name, (desc, func) in scenarios.items():
            print(f"\n--> Injecting Scenario: {desc}")
            logs = func()
            send_logs(api_url, logs, dry_run)
            time.sleep(1.0)
        return

    if scenario_name in scenarios:
        desc, func = scenarios[scenario_name]
        print(f"\n--> Injecting Scenario: {desc}")
        logs = func()
        send_logs(api_url, logs, dry_run)
    else:
        print(f"Unknown scenario '{scenario_name}'. Available: {list(scenarios.keys()) + ['all']}")


def main():
    parser = argparse.ArgumentParser(description="LogIntel Heterogeneous Infrastructure Log Simulator")
    parser.add_argument("--api-url", default="http://localhost:8000/api/logs/ingest", help="LogIntel ingestion endpoint URL")
    parser.add_argument("--mode", choices=["batch", "stream", "scenario"], default="batch", help="Simulation mode")
    parser.add_argument("--count", type=int, default=20, help="Number of logs in batch mode")
    parser.add_argument("--interval", type=float, default=1.0, help="Interval in seconds between logs in stream mode")
    parser.add_argument("--source", choices=["all", "aws", "firewall", "switch", "cctv", "server"], default="all", help="Filter log source type")
    parser.add_argument("--scenario", choices=["bruteforce", "portscan", "flood", "cctv", "aws", "all"], default="bruteforce", help="Attack scenario to inject")
    parser.add_argument("--dry-run", action="store_true", help="Print logs to stdout instead of sending to API")

    args = parser.parse_args()

    print("=" * 60)
    print("  LOGINTEL — Centralized Log Intelligence & Security Platform")
    print("  Heterogeneous Infrastructure Log Generator")
    print(f"  Target: {args.api_url} | Mode: {args.mode}")
    print("=" * 60)

    if args.mode == "scenario":
        run_scenario(args.api_url, args.scenario, args.dry_run)
    elif args.mode == "batch":
        print(f"Generating batch of {args.count} logs...")
        logs = [get_random_log(args.source) for _ in range(args.count)]
        send_logs(args.api_url, logs, args.dry_run)
    elif args.mode == "stream":
        print(f"Streaming continuous logs every {args.interval}s (Ctrl+C to stop)...")
        try:
            while True:
                log = get_random_log(args.source)
                send_logs(args.api_url, [log], args.dry_run)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStreaming halted by user.")


if __name__ == "__main__":
    main()
