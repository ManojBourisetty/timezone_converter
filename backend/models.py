from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class TimezoneConversionRequest(BaseModel):
    datetime: str = Field(..., description="ISO datetime string")
    sourceTimezone: str = Field(..., description="Source timezone (e.g., America/New_York)")
    targetTimezone: str = Field(..., description="Target timezone (e.g., Europe/London)")

class TimeInfo(BaseModel):
    datetime: str
    timezone: str
    formatted: str
    city: str
    offset: str

class TimezoneConversionResponse(BaseModel):
    sourceTime: TimeInfo
    targetTime: TimeInfo

class CityTime(BaseModel):
    timezone: str
    city: str
    currentTime: str
    formatted: str
    date: str
    offset: str

class MajorCitiesResponse(BaseModel):
    cities: List[CityTime]
    timestamp: str

class TimezoneInfo(BaseModel):
    value: str
    label: str
    city: str
    offset: str
    country: str