from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZIPMiddleware
import os
import logging
import json
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
app.add_middleware(GZIPMiddleware, minimum_size=1000)

# Configure CORS - RESTRICT to specific origins for security
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
allowed_origins = [origin.strip() for origin in allowed_origins]

logger.info(f"Configuring CORS for origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Only necessary methods
    allow_headers=["Content-Type", "Authorization"],  # Only necessary headers
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = datetime.now(timezone.utc)
    
    logger.info(f"Incoming {request.method} {request.url.path} from {request.client}")
    
    try:
        response = await call_next(request)
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        logger.info(f"Response {response.status_code} completed in {duration:.2f}s")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}", exc_info=True)
        raise


# Graceful shutdown handling
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("Application shutting down...")
    if client:
        client.close()
        logger.info("MongoDB connection closed")


if __name__ == "__main__":
    import uvicorn
    
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8001))
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
