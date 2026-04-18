from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
import os
import logging
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import List

# Import from backend directory
import sys
sys.path.append(str(Path(__file__).parent / '..' / 'backend'))

from models import (
    TimezoneConversionRequest,
    TimezoneConversionResponse,
    MajorCitiesResponse,
    TimezoneInfo
)
from timezone_service import TimezoneService

# Configure logging before anything else
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app without a prefix
app = FastAPI(
    title="Timezone Converter API",
    version="1.0.0",
    description="Real-time timezone conversion API"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize timezone service
timezone_service = TimezoneService()

# Timezone conversion endpoint
@api_router.post("/convert-timezone", response_model=TimezoneConversionResponse)
async def convert_timezone(request: TimezoneConversionRequest):
    """Convert time between two timezones"""
    try:
        logger.info(f"Converting timezone from {request.sourceTimezone} to {request.targetTimezone}")
        result = timezone_service.convert_timezone(
            request.datetime,
            request.sourceTimezone,
            request.targetTimezone
        )
        logger.info("Timezone conversion successful")
        return result
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during conversion: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Get major cities current time
@api_router.get("/major-cities-time", response_model=MajorCitiesResponse)
async def get_major_cities_time():
    """Get current time in major cities"""
    try:
        cities = timezone_service.get_major_cities_time()
        return {
            "cities": cities,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching major cities time: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Get all available timezones
@api_router.get("/timezones", response_model=List[TimezoneInfo])
async def get_all_timezones():
    """Get all available timezones"""
    try:
        timezones = timezone_service.get_all_timezones()
        return timezones
    except Exception as e:
        logger.error(f"Error fetching timezones: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

# Include the router in the main app
app.include_router(api_router)

# Add GZIP compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS - Allow all for Vercel deployment (will be restricted later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will be updated with actual frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = datetime.now(timezone.utc)
    response = await call_next(request)
    process_time = (datetime.now(timezone.utc) - start_time).total_seconds()
    logger.info(f"{request.method} {request.url} - {response.status_code} - {process_time:.3f}s")
    return response