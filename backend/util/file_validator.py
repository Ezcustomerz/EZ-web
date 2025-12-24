import os
from typing import Tuple, Optional, List
from fastapi import UploadFile

class FileValidator:
    """Validates files using extension and basic checks"""
    
    # Dangerous file extensions to block
    DANGEROUS_EXTENSIONS = {
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
        '.jar', '.app', '.deb', '.rpm', '.msi', '.dmg', '.sh', '.ps1',
        '.dll', '.sys', '.drv', '.ocx', '.cpl', '.hta', '.wsf', '.wsh',
        '.applescript', '.scpt', '.vb', '.vbe', '.jse', '.ws', '.msp'
    }
    
    MAX_FILE_SIZE = 30 * 1024 * 1024 * 1024  # 30GB default
    
    @staticmethod
    async def validate_file(
        file: UploadFile,
        max_size: Optional[int] = None,
        allowed_extensions: Optional[List[str]] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate file using multiple checks
        Returns: (is_valid, error_message)
        """
        max_size = max_size or FileValidator.MAX_FILE_SIZE
        
        # Check file size
        content = await file.read()
        await file.seek(0)
        
        if len(content) > max_size:
            return False, f"File size ({len(content) / (1024*1024):.1f}MB) exceeds limit ({max_size / (1024*1024)}MB)"
        
        # Check extension
        if file.filename:
            ext = os.path.splitext(file.filename)[1].lower()
            
            if ext in FileValidator.DANGEROUS_EXTENSIONS:
                return False, f"File type {ext} is not allowed for security reasons"
            
            if allowed_extensions and ext not in allowed_extensions:
                return False, f"File type {ext} is not allowed. Allowed: {', '.join(allowed_extensions)}"
        
        return True, None

