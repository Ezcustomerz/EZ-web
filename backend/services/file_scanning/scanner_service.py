from typing import Tuple, Optional, Dict
from fastapi import UploadFile
from services.file_scanning.clamav_scanner import ClamAVScanner
from util.file_validator import FileValidator
import logging
import os

logger = logging.getLogger(__name__)

class ScannerService:
    """Main service that orchestrates file validation and scanning"""
    
    def __init__(self):
        # Check if we're in dev_deploy mode - skip ClamAV in that case
        self.env = os.getenv("ENV", "dev").lower()
        self.skip_clamav = self.env == "dev_deploy"
        
        if self.skip_clamav:
            logger.info("dev_deploy mode detected - ClamAV scanning will be skipped")
            self.clamav = None
        else:
            self.clamav = ClamAVScanner()
        
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
        
        # Step 2: ClamAV scan (primary) - skip in dev_deploy mode
        if self.skip_clamav:
            logger.info(f"ClamAV scanning skipped for {file.filename} (dev_deploy mode)")
            scan_details['clamav'] = {
                'available': False,
                'scanned': False,
                'skipped': True,
                'reason': 'dev_deploy mode - ClamAV scanning disabled'
            }
        elif not self.clamav.is_available():
            if fail_if_scanner_unavailable:
                return False, "File scanning service unavailable. Please try again later.", scan_details
            else:
                logger.warning(f"ClamAV unavailable for {file.filename}, proceeding without scan")
                scan_details['clamav'] = {'available': False, 'scanned': False}
        else:
            is_safe, threat, clamav_details = await self.clamav.scan_file(file)
            scan_details['clamav'] = clamav_details
            
            if not is_safe:
                return False, threat, scan_details
        
        return True, None, scan_details

