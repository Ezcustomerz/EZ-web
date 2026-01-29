from typing import Tuple, Optional, Dict
from fastapi import UploadFile
from services.file_scanning.clamav_scanner import ClamAVScanner
from util.file_validator import FileValidator
from core.safe_errors import is_dev_env
import logging
import os

logger = logging.getLogger(__name__)

class ScannerService:
    """Main service that orchestrates file validation and scanning"""
    
    def __init__(self):
        # ClamAV scanning is disabled for all environments
        self.env = os.getenv("ENV", "dev").lower()
        self.skip_clamav = True
        
        logger.info("ClamAV scanning is disabled")
        self.clamav = None
        
        self.validator = FileValidator()
    
    async def scan_and_validate(
        self,
        file: UploadFile,
        max_size: Optional[int] = None,
        allowed_extensions: Optional[list] = None,
        fail_if_scanner_unavailable: bool = True
    ) -> Tuple[bool, Optional[str], Dict]:
        """
        Complete file security check: validation + ClamAV scanning
        
        Args:
            file: File to scan
            max_size: Maximum file size in bytes
            allowed_extensions: List of allowed extensions (None = use defaults)
            fail_if_scanner_unavailable: If True, reject files when scanner is down
        
        Returns:
            (is_safe, error_message, scan_details)
        """
        scan_details = {}
        
        # Step 1: Basic file validation
        is_valid, error = await self.validator.validate_file(file, max_size, allowed_extensions)
        if not is_valid:
            return False, error, {}
        
        scan_details['validation'] = 'passed'
        
        # Step 2: ClamAV scan (primary) - currently disabled
        if self.skip_clamav:
            if is_dev_env():
                logger.info("ClamAV scanning skipped")
            scan_details['clamav'] = {
                'available': False,
                'scanned': False,
                'skipped': True,
                'reason': 'ClamAV scanning disabled'
            }
        elif not self.clamav.is_available():
            if fail_if_scanner_unavailable:
                return False, "File scanning service unavailable. Please try again later.", scan_details
            else:
                if is_dev_env():
                    logger.warning("ClamAV unavailable, proceeding without scan")
                scan_details['clamav'] = {'available': False, 'scanned': False}
        else:
            is_safe, threat, clamav_details = await self.clamav.scan_file(file)
            scan_details['clamav'] = clamav_details
            
            if not is_safe:
                return False, threat, scan_details
        
        return True, None, scan_details

