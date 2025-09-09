from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone
from models import (
    TimezoneConversionRequest, 
    TimezoneConversionResponse, 
    MajorCitiesResponse,
    TimezoneInfo
)
from timezone_service import TimezoneService
from typing import List

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize timezone service
timezone_service = TimezoneService()

# Existing routes
@api_router.get("/")
async def root():
    return {"message": "Timezone Converter API"}

# Timezone conversion endpoint
@api_router.post("/convert-timezone", response_model=TimezoneConversionResponse)
async def convert_timezone(request: TimezoneConversionRequest):
    try:
        result = timezone_service.convert_timezone(
            request.datetime,
            request.sourceTimezone,
            request.targetTimezone
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Get major cities current time
@api_router.get("/major-cities-time", response_model=MajorCitiesResponse)
async def get_major_cities_time():
    try:
        cities = timezone_service.get_major_cities_time()
        return {
            "cities": cities,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Get all available timezones
@api_router.get("/timezones", response_model=List[TimezoneInfo])
async def get_all_timezones():
    try:
        timezones = timezone_service.get_all_timezones()
        return timezones
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://timezone-frontend.onrender.com",  # Replace with your actual frontend URL
        "http://localhost:3000",  # Keep for local development
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
