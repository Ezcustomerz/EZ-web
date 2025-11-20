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
        
        try:
            # Read file content
            content = await file.read()
            await file.seek(0)  # Reset for later use
            
            # Scan the file
            scan_result = self.clamd.scan_stream(content)
            
            scan_details = {
                'scanner': 'ClamAV',
                'connection_type': self.connection_type,
                'file_size': len(content),
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
            
        except pyclamd.ConnectionError:
            logger.warning("ClamAV connection lost, attempting reconnect")
            self._connect()
            if not self.is_available():
                return False, "ClamAV scanner connection error", {'available': False}
            # Retry once
            return await self.scan_file(file)
        except Exception as e:
            logger.error(f"ClamAV scan error: {str(e)}", exc_info=True)
            return False, f"Scan error: {str(e)}", {'error': str(e)}

