import json
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class DetectionRuleBase(BaseModel):
    rule_id: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    description: str
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    event_type: Optional[str] = None
    threshold: int = 5
    window_seconds: int = 60
    conditions: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_enabled: bool = True

    @field_validator("conditions", mode="before")
    @classmethod
    def parse_conditions(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v or {}


class DetectionRuleCreate(DetectionRuleBase):
    pass


class DetectionRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    event_type: Optional[str] = None
    threshold: Optional[int] = None
    window_seconds: Optional[int] = None
    conditions: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None


class DetectionRuleOut(DetectionRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
