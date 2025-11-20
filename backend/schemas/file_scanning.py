from pydantic import BaseModel
from typing import Optional, Dict, List

class FileScanRequest(BaseModel):
    """Request model for file scanning"""
    pass

class FileScanResult(BaseModel):
    """Result for a single file scan"""
    filename: str
    is_safe: bool
    error_message: Optional[str] = None
    scan_details: Optional[Dict] = None

class FileScanResponse(BaseModel):
    """Response model for file scanning"""
    results: List[FileScanResult]
    total_files: int
    safe_files: int
    unsafe_files: int
    scanner_available: bool
    clamav_skipped: bool = False
    skip_reason: Optional[str] = None

