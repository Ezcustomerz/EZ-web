"""
Utility to set up Supabase Storage buckets
"""
import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

def ensure_bucket_exists(bucket_name: str, is_public: bool = False) -> bool:
    """
    Ensure a storage bucket exists, create it if it doesn't.
    
    Args:
        bucket_name: Name of the bucket
        is_public: Whether the bucket should be public (default: False for private)
    
    Returns:
        True if bucket exists or was created successfully, False otherwise
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_service_key:
            logger.error("Missing Supabase configuration")
            return False
        
        admin_client: Client = create_client(supabase_url, supabase_service_key)
        
        # Try to list buckets to check if it exists
        try:
            buckets = admin_client.storage.list_buckets()
            existing_bucket = next((b for b in buckets if b.name == bucket_name), None)
            
            if existing_bucket:
                logger.info(f"Bucket '{bucket_name}' already exists")
                return True
        except Exception as e:
            logger.warning(f"Could not list buckets: {e}")
        
        # Bucket doesn't exist, create it
        try:
            # Use the storage API to create bucket
            # Note: The Python client may not have a direct create_bucket method
            # We'll need to use the REST API directly
            import requests
            
            headers = {
                "apikey": supabase_service_key,
                "Authorization": f"Bearer {supabase_service_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "name": bucket_name,
                "public": is_public,
                "file_size_limit": 30 * 1024 * 1024 * 1024,  # 30GB in bytes
                "allowed_mime_types": None  # Allow all file types
            }
            
            response = requests.post(
                f"{supabase_url}/storage/v1/bucket",
                headers=headers,
                json=data
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"Successfully created bucket '{bucket_name}'")
                return True
            elif response.status_code == 409:
                # Bucket already exists (race condition)
                logger.info(f"Bucket '{bucket_name}' already exists")
                return True
            else:
                logger.error(f"Failed to create bucket: {response.status_code} - {response.text}")
                return False
                
        except ImportError:
            logger.error("requests library not available. Please install it: pip install requests")
            return False
        except Exception as e:
            logger.error(f"Error creating bucket: {e}")
            return False
            
    except Exception as e:
        logger.error(f"Error ensuring bucket exists: {e}")
        return False

