import pyclamd
import os
import logging
from typing import Tuple, Optional, Dict
from fastapi import UploadFile

logger = logging.getLogger(__name__)

class ClamAVScanner:
    """ClamAV antivirus scanner integration"""
    
    def __init__(self):
        self.clamd = None
        self.connection_type = None
        self._connect()
    
    def _connect(self):
        """Connect to ClamAV daemon"""
        try:
            # Try Unix socket first (faster, more secure)
            unix_socket_path = os.getenv('CLAMAV_UNIX_SOCKET', '/var/run/clamav/clamd.ctl')
            if os.path.exists(unix_socket_path):
                self.clamd = pyclamd.ClamdUnixSocket(unix_socket_path)
                self.connection_type = 'unix'
                logger.info(f"Connected to ClamAV via Unix socket: {unix_socket_path}")
            else:
                # Fall back to TCP connection
                host = os.getenv('CLAMAV_HOST', 'localhost')
                port = int(os.getenv('CLAMAV_PORT', 3310))
                self.clamd = pyclamd.ClamdNetworkSocket(host, port)
                self.connection_type = 'tcp'
                logger.info(f"Connected to ClamAV via TCP: {host}:{port}")
            
            # Test connection
            self.clamd.ping()
            logger.info("ClamAV connection successful")
        except pyclamd.ConnectionError as e:
            logger.error(f"ClamAV connection failed: {e}")
            self.clamd = None
        except Exception as e:
            logger.error(f"ClamAV initialization error: {e}")
            self.clamd = None
    
    def is_available(self) -> bool:
        """Check if ClamAV is available"""
        if not self.clamd:
            return False
        try:
            self.clamd.ping()
            return True
        except:
            self._connect()  # Try to reconnect
            return self.clamd is not None
    
    async def scan_file(self, file: UploadFile) -> Tuple[bool, Optional[str], Dict]:
        """
        Scan file for malware using ClamAV
        
        Returns:
            (is_safe, threat_name_or_error, scan_details)
        """
        if not self.is_available():
            return False, "ClamAV scanner unavailable", {'available': False}
        
        # Read file content once at the start
        content = await file.read()
        await file.seek(0)  # Reset for later use
        file_size = len(content)
        
        # ClamAV default max file size is typically 100MB, but can be configured
        # For files larger than 2GB, skip ClamAV to avoid connection issues
        # This is a reasonable threshold that balances security and performance
        # Files up to 30GB are allowed but won't be scanned by ClamAV
        CLAMAV_MAX_SIZE = 2 * 1024 * 1024 * 1024  # 2GB
        
        if file_size > CLAMAV_MAX_SIZE:
            logger.info(f"File {file.filename} ({file_size / (1024*1024):.1f}MB) exceeds ClamAV recommended size ({CLAMAV_MAX_SIZE / (1024*1024):.1f}MB), skipping scan")
            return True, None, {
                'scanner': 'ClamAV',
                'connection_type': self.connection_type,
                'file_size': file_size,
                'filename': file.filename,
                'scanned': False,
                'skipped': True,
                'reason': f'File size ({file_size / (1024*1024):.1f}MB) exceeds ClamAV recommended limit ({CLAMAV_MAX_SIZE / (1024*1024):.1f}MB)'
            }
        
        try:
            # Scan the file
            scan_result = self.clamd.scan_stream(content)
            
            scan_details = {
                'scanner': 'ClamAV',
                'connection_type': self.connection_type,
                'file_size': file_size,
                'filename': file.filename
            }
            
            if scan_result:
                # File is infected
                # scan_result format: {stream: ('FOUND', 'ThreatName')}
                threat_info = list(scan_result.values())[0]
                threat_name = threat_info[1] if isinstance(threat_info, tuple) else str(threat_info)
                
                scan_details['threat_detected'] = True
                scan_details['threat_name'] = threat_name
                
                return False, f"Malware detected: {threat_name}", scan_details
            
            # File is clean
            scan_details['threat_detected'] = False
            return True, None, scan_details
            
        except (pyclamd.ConnectionError, ConnectionAbortedError, OSError) as e:
            # Handle connection errors - could be due to large file size or ClamAV limits
            error_str = str(e)
            logger.warning(f"ClamAV connection error for {file.filename}: {error_str}")
            
            # If it's a connection abort and file is large, skip scan but allow file
            if isinstance(e, (ConnectionAbortedError, OSError)) and ('10053' in error_str or 'aborted' in error_str.lower()):
                if file_size > 100 * 1024 * 1024:  # If file is > 100MB, likely a size issue
                    logger.warning(f"ClamAV connection aborted for large file {file.filename} ({file_size / (1024*1024):.1f}MB), allowing file through")
                    return True, None, {
                        'scanner': 'ClamAV',
                        'connection_type': self.connection_type,
                        'file_size': file_size,
                        'filename': file.filename,
                        'scanned': False,
                        'skipped': True,
                        'reason': 'Connection aborted - likely due to large file size. File allowed through.',
                        'warning': 'File was not scanned due to size limitations'
                    }
            
            # Try to reconnect for other connection errors
            self._connect()
            if not self.is_available():
                return False, "ClamAV scanner connection error", {'available': False}
            # Retry once for connection errors (but only for smaller files to avoid infinite loop)
            if file_size <= CLAMAV_MAX_SIZE:
                return await self.scan_file(file)
            else:
                # File is too large, allow it through
                return True, None, {
                    'scanner': 'ClamAV',
                    'connection_type': self.connection_type,
                    'file_size': file_size,
                    'filename': file.filename,
                    'scanned': False,
                    'skipped': True,
                    'reason': 'Connection error on large file. File allowed through.',
                    'warning': 'File was not scanned due to connection issues'
                }
        except Exception as e:
            logger.error(f"ClamAV scan error: {str(e)}", exc_info=True)
            # For other errors, check if it's a size-related issue
            error_str = str(e).lower()
            if 'size' in error_str or 'too large' in error_str or 'limit' in error_str:
                logger.warning(f"ClamAV size-related error for {file.filename} ({file_size / (1024*1024):.1f}MB), allowing file through")
                return True, None, {
                    'scanner': 'ClamAV',
                    'connection_type': self.connection_type,
                    'file_size': file_size,
                    'filename': file.filename,
                    'scanned': False,
                    'skipped': True,
                    'reason': 'File size exceeds ClamAV limits. File allowed through.',
                    'warning': 'File was not scanned due to size limitations'
                }
            return False, f"Scan error: {str(e)}", {'error': str(e)}

