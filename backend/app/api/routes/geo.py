"""
Geo API routes — Real-time INCOIS WMS Proxy and Geospatial Services.
Provides high-performance, cached WMS tile proxy for INCOIS layers:
- PFZ_Automation:pfzlines (Potential Fishing Zones)
- PFZ-TUNA-SST-CHL:sst (Sea Surface Temperature)
- PFZ-TUNA-SST-CHL:chl (Chlorophyll Concentration)
- PFZ_LandingCentres:LandingCenters_29Apr2024 (Landing Centers)
- PFZ_Bathymetry:bathymetry (Bathymetry Contours)
"""
from __future__ import annotations

import time
from typing import Dict, Tuple
import httpx
import structlog
from fastapi import APIRouter, Query, Response

logger = structlog.get_logger()
router = APIRouter()

INCOIS_WMS_BASE = "https://incois.gov.in/geoserver/wms"

# 1x1 transparent PNG fallback
TRANSPARENT_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00"
    b"\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)

# In-memory tile cache: key -> (image_bytes, timestamp)
_tile_cache: Dict[str, Tuple[bytes, float]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour cache per tile
MAX_CACHE_ENTRIES = 2000

AVAILABLE_LAYERS = {
    "pfz_lines": {
        "id": "PFZ_Automation:pfzlines",
        "name": "Potential Fishing Zones (PFZ Lines)",
        "description": "Daily real-time PFZ satellite advisory lines from INCOIS",
        "type": "pfz",
    },
    "sst": {
        "id": "PFZ-TUNA-SST-CHL:sst",
        "name": "Sea Surface Temperature (SST)",
        "description": "Daily thermal gradient fronts from Oceansat & AVHRR",
        "type": "sst",
    },
    "chlorophyll": {
        "id": "PFZ-TUNA-SST-CHL:chl",
        "name": "Chlorophyll-a Fronts",
        "description": "Ocean Colour Monitor (OCM) biological productivity zones",
        "type": "chlorophyll",
    },
    "landing_centers": {
        "id": "PFZ_LandingCentres:LandingCenters_29Apr2024",
        "name": "Official Landing Centers",
        "description": "Registered marine landing centers along Indian coastlines",
        "type": "poi",
    },
    "bathymetry": {
        "id": "PFZ_Bathymetry:bathymetry",
        "name": "Ocean Bathymetry",
        "description": "Depth contours and sea floor topography",
        "type": "bathymetry",
    },
}


@router.get("/layers", summary="Get list of available real-time INCOIS WMS layers")
async def get_available_layers():
    """Returns available layers configured for MapLibre WMS display."""
    return {
        "provider": "Indian National Centre for Ocean Information Services (INCOIS)",
        "wms_service": INCOIS_WMS_BASE,
        "layers": AVAILABLE_LAYERS,
    }


@router.get("/wms/tile", summary="Proxy real-time WMS tile from INCOIS with local caching")
async def incois_wms_tile(
    bbox: str = Query(..., description="Bounding box in EPSG:3857 (minx,miny,maxx,maxy)"),
    layer: str = Query("PFZ_Automation:pfzlines", description="INCOIS layer name"),
    width: int = Query(256, description="Tile width in pixels"),
    height: int = Query(256, description="Tile height in pixels"),
):
    """
    Proxies MapLibre EPSG:3857 tile requests to INCOIS GeoServer.
    Eliminates browser CORS restrictions and provides instant in-memory tile caching.
    """
    cache_key = f"{layer}_{bbox}_{width}_{height}"
    now = time.time()

    # Check cache
    if cache_key in _tile_cache:
        cached_data, timestamp = _tile_cache[cache_key]
        if now - timestamp < CACHE_TTL_SECONDS:
            return Response(
                content=cached_data,
                media_type="image/png",
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "X-Tile-Cache": "HIT",
                },
            )

    params = {
        "SERVICE": "WMS",
        "VERSION": "1.1.1",
        "REQUEST": "GetMap",
        "LAYERS": layer,
        "SRS": "EPSG:3857",
        "BBOX": bbox,
        "WIDTH": str(width),
        "HEIGHT": str(height),
        "FORMAT": "image/png",
        "TRANSPARENT": "TRUE",
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                INCOIS_WMS_BASE,
                params=params,
                headers={"User-Agent": "ORCA-Marine-Intelligence/1.0"},
            )

            if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image/"):
                tile_bytes = resp.content

                # Evict oldest if cache gets full
                if len(_tile_cache) > MAX_CACHE_ENTRIES:
                    oldest_key = min(_tile_cache.keys(), key=lambda k: _tile_cache[k][1])
                    _tile_cache.pop(oldest_key, None)

                _tile_cache[cache_key] = (tile_bytes, now)
                return Response(
                    content=tile_bytes,
                    media_type="image/png",
                    headers={
                        "Cache-Control": "public, max-age=3600",
                        "X-Tile-Cache": "MISS",
                    },
                )
            else:
                logger.warning(
                    "geo.wms.tile_error",
                    status=resp.status_code,
                    layer=layer,
                    body=resp.text[:120],
                )
    except Exception as e:
        logger.warning("geo.wms.fetch_failed", layer=layer, error=str(e))

    # Return cached version if exists (even if stale), else transparent PNG
    if cache_key in _tile_cache:
        return Response(
            content=_tile_cache[cache_key][0],
            media_type="image/png",
            headers={"X-Tile-Cache": "STALE"},
        )

    return Response(
        content=TRANSPARENT_PNG,
        media_type="image/png",
        headers={"X-Tile-Cache": "FALLBACK"},
    )


@router.get("/status", summary="Check INCOIS WMS server health")
async def get_incois_status():
    """Ping INCOIS GeoServer to verify external connectivity."""
    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            r = await client.get(
                f"{INCOIS_WMS_BASE}?SERVICE=WMS&REQUEST=GetCapabilities",
                headers={"User-Agent": "ORCA-Platform/1.0"},
            )
            elapsed_ms = int((time.time() - t0) * 1000)
            is_ok = r.status_code == 200 and ("WMS_Capabilities" in r.text or "WMT_MS_Capabilities" in r.text)
            return {
                "incois_wms_online": is_ok,
                "latency_ms": elapsed_ms,
                "status_code": r.status_code,
                "cached_tiles_count": len(_tile_cache),
            }
    except Exception as e:
        return {
            "incois_wms_online": False,
            "error": str(e),
            "cached_tiles_count": len(_tile_cache),
        }
