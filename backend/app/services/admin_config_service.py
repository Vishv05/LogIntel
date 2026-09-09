import json
import os
from typing import Dict, Any

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "..", "core", "admin_state.json")

DEFAULT_ALERT_POLICIES = [
    {
        "severity": "CRITICAL",
        "action": "ESCALATE_INCIDENT",
        "notify_email": True,
        "notify_webhook": True,
        "notify_slack": True,
        "auto_assign_role": "security_analyst",
        "escalation_sla_minutes": 15,
        "description": "Immediate incident synthesis, page on-call SOC analyst, notify Slack war-room."
    },
    {
        "severity": "HIGH",
        "action": "ESCALATE_INCIDENT",
        "notify_email": True,
        "notify_webhook": True,
        "notify_slack": True,
        "auto_assign_role": "security_analyst",
        "escalation_sla_minutes": 60,
        "description": "Correlate with existing incidents, notify security channel, dispatch webhook."
    },
    {
        "severity": "MEDIUM",
        "action": "ALERT",
        "notify_email": False,
        "notify_webhook": True,
        "notify_slack": False,
        "auto_assign_role": "user",
        "escalation_sla_minutes": 240,
        "description": "Queue in active alert triage dashboard for analyst review."
    },
    {
        "severity": "LOW",
        "action": "LOG_ONLY",
        "notify_email": False,
        "notify_webhook": False,
        "notify_slack": False,
        "auto_assign_role": "user",
        "escalation_sla_minutes": 1440,
        "description": "Index in search store with informational classification."
    }
]

DEFAULT_SECURITY_SETTINGS = {
    "jwt_expiry_minutes": 1440,
    "min_password_length": 8,
    "require_special_char": True,
    "max_failed_attempts": 5,
    "lockout_duration_minutes": 30,
    "session_inactivity_timeout_minutes": 60,
    "enforce_mfa": False,
    "allowed_cors_domains": [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000"
    ]
}

DEFAULT_RETENTION_SETTINGS = {
    "total_capacity_gb": 500,
    "normal_logs_days": 30,
    "security_logs_days": 90,
    "incident_logs_days": 365,
    "auto_purge_enabled": True,
    "compression_ratio": "3.8:1"
}

DEFAULT_INTEGRATIONS = {
    "slack": {
        "enabled": False,
        "webhook_url": "",
        "channel": "#soc-security-alerts",
        "notify_on": ["CRITICAL", "HIGH"]
    },
    "webhook": {
        "enabled": False,
        "endpoint_url": "",
        "secret_token": "",
        "notify_on": ["CRITICAL", "HIGH", "MEDIUM"]
    },
    "email": {
        "enabled": False,
        "smtp_host": "",
        "smtp_port": 587,
        "sender_email": "soc-alerts@logintel.internal",
        "smtp_password": "",
        "recipients": ["soc-team@logintel.internal"]
    },
    "syslog_forwarder": {
        "enabled": True,
        "target_host": "10.0.0.99",
        "target_port": 514,
        "protocol": "UDP",
        "format": "RFC5424"
    }
}


class AdminConfigService:
    @staticmethod
    def _load_config() -> Dict[str, Any]:
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        
        default_config = {
            "alert_policies": DEFAULT_ALERT_POLICIES,
            "security_settings": DEFAULT_SECURITY_SETTINGS,
            "retention_settings": DEFAULT_RETENTION_SETTINGS,
            "integrations": DEFAULT_INTEGRATIONS
        }
        AdminConfigService._save_config(default_config)
        return default_config

    @staticmethod
    def _save_config(config: Dict[str, Any]):
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    @classmethod
    def get_alert_policies(cls):
        cfg = cls._load_config()
        return cfg.get("alert_policies", DEFAULT_ALERT_POLICIES)

    @classmethod
    def update_alert_policies(cls, new_policies):
        cfg = cls._load_config()
        cfg["alert_policies"] = new_policies
        cls._save_config(cfg)
        return cfg["alert_policies"]

    @classmethod
    def get_security_settings(cls):
        cfg = cls._load_config()
        settings_dict = cfg.get("security_settings", DEFAULT_SECURITY_SETTINGS).copy()
        # Always mask secrets
        settings_dict["secret_key_masked"] = "••••••••••••••••"
        return settings_dict

    @classmethod
    def update_security_settings(cls, updates: Dict[str, Any]):
        cfg = cls._load_config()
        current = cfg.get("security_settings", DEFAULT_SECURITY_SETTINGS)
        for k, v in updates.items():
            if k != "secret_key_masked":
                current[k] = v
        cfg["security_settings"] = current
        cls._save_config(cfg)
        return cls.get_security_settings()

    @classmethod
    def get_retention_settings(cls):
        cfg = cls._load_config()
        return cfg.get("retention_settings", DEFAULT_RETENTION_SETTINGS)

    @classmethod
    def update_retention_settings(cls, updates: Dict[str, Any]):
        cfg = cls._load_config()
        current = cfg.get("retention_settings", DEFAULT_RETENTION_SETTINGS)
        current.update(updates)
        cfg["retention_settings"] = current
        cls._save_config(cfg)
        return current

    @classmethod
    def get_integrations(cls):
        cfg = cls._load_config()
        integrations = json.loads(json.dumps(cfg.get("integrations", DEFAULT_INTEGRATIONS)))
        # Mask sensitive integration credentials
        if "slack" in integrations and "webhook_url" in integrations["slack"]:
            url = integrations["slack"]["webhook_url"]
            if len(url) > 35:
                integrations["slack"]["webhook_url"] = url[:35] + "/••••••••"
        if "webhook" in integrations and "secret_token" in integrations["webhook"]:
            integrations["webhook"]["secret_token"] = "••••••••••••"
        if "email" in integrations and "smtp_password" in integrations["email"]:
            integrations["email"]["smtp_password"] = "••••••••••••"
        return integrations

    @classmethod
    def update_integrations(cls, updates: Dict[str, Any]):
        cfg = cls._load_config()
        current = cfg.get("integrations", DEFAULT_INTEGRATIONS)
        for name, data in updates.items():
            if name in current and isinstance(data, dict):
                # Don't overwrite with masked string
                for field, val in data.items():
                    if "••••" not in str(val):
                        current[name][field] = val
            else:
                current[name] = data
        cfg["integrations"] = current
        cls._save_config(cfg)
        return cls.get_integrations()
