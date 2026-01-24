import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import Request, Depends
from typing import Optional
import logging

load_dotenv() 

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Validate environment variables are set
if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_SERVICE_ROLE_KEY:
    missing = []
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_ANON_KEY:
        missing.append("SUPABASE_ANON")
    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    error_msg = f"Missing Supabase configuration. Required environment variables not set: {', '.join(missing)}"
    logger.error(error_msg)
    raise ValueError(error_msg)

# Create Supabase clients with better error handling
try:
    db_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    logger.info(f"Created Supabase client with URL: {SUPABASE_URL}")
except Exception as e:
    logger.error(f"Failed to create Supabase client (anon): {e}")
    logger.error(f"SUPABASE_URL: {SUPABASE_URL[:50]}..." if SUPABASE_URL else "SUPABASE_URL: None")
    logger.error(f"SUPABASE_ANON_KEY length: {len(SUPABASE_ANON_KEY) if SUPABASE_ANON_KEY else 0}")
    raise ValueError(f"Invalid Supabase configuration (anon key): {e}")

try:
    db_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info("Created Supabase admin client")
except Exception as e:
    logger.error(f"Failed to create Supabase admin client (service_role): {e}")
    logger.error(f"SUPABASE_URL: {SUPABASE_URL[:50]}..." if SUPABASE_URL else "SUPABASE_URL: None")
    logger.error(f"SUPABASE_SERVICE_ROLE_KEY length: {len(SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_SERVICE_ROLE_KEY else 0}")
    raise ValueError(f"Invalid Supabase configuration (service_role key): {e}")

def get_authenticated_client(request: Request) -> Client:
    """
    Create an authenticated Supabase client from the JWT token in the request.
    This respects RLS policies based on the authenticated user.
    
    OPTIMIZED: Reuses token stored in request.state.token by middleware
    to avoid redundant token extraction.
    
    Args:
        request: FastAPI Request object containing JWT token
        
    Returns:
        Authenticated Supabase Client
    """
    # Try to get token from request.state (set by middleware) - OPTIMIZED PATH
    token = getattr(request.state, 'token', None)
    
    # Fallback: Extract token if not in state (backward compatibility)
    if not token:
        if not isinstance(request, Request) or not hasattr(request, 'cookies'):
            return db_client
        
        try:
            token = request.cookies.get("sb-access-token")
            if not token:
                auth = request.headers.get("Authorization")
                if auth and auth.startswith("Bearer "):
                    token = auth.split(" ")[1]
        except (AttributeError, TypeError):
            return db_client
    
    if not token:
        return db_client
    
    # Create client and authenticate with JWT token for RLS
    # The JWT token must be set in the Authorization header for RLS policies to work
    # For Supabase Python client, we need to set the token on the postgrest client's session
    try:
        # Create a new client instance
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        # Set the JWT token on the postgrest client's session headers
        # This is required for RLS policies to evaluate auth.uid() correctly
        if hasattr(client, 'postgrest'):
            try:
                # The postgrest client uses a session object with headers
                # We need to set the Authorization header with the JWT token
                if hasattr(client.postgrest, 'session'):
                    # Set headers on the session object
                    if not hasattr(client.postgrest.session, 'headers'):
                        # If headers don't exist, try to create them
                        client.postgrest.session.headers = {}
                    client.postgrest.session.headers['Authorization'] = f'Bearer {token}'
                    client.postgrest.session.headers['apikey'] = SUPABASE_ANON_KEY
                    logger.debug("Set JWT token on postgrest session headers")
                elif hasattr(client.postgrest, 'headers'):
                    # Fallback: set headers directly if session doesn't exist
                    client.postgrest.headers['Authorization'] = f'Bearer {token}'
                    client.postgrest.headers['apikey'] = SUPABASE_ANON_KEY
                    logger.debug("Set JWT token on postgrest headers")
                else:
                    # Last resort: try using the auth() method if available
                    if hasattr(client.postgrest, 'auth'):
                        client.postgrest.auth(token)
                        logger.debug("Set JWT token using postgrest auth() method")
            except Exception as header_error:
                logger.warning(f"Could not set JWT headers on postgrest client: {header_error}")
                # Try alternative method
                try:
                    if hasattr(client.postgrest, 'auth'):
                        client.postgrest.auth(token)
                        logger.debug("Set JWT token using postgrest auth() method (fallback)")
                except Exception as auth_error:
                    logger.error(f"Failed to set JWT token via any method: {auth_error}")
        
        logger.debug(f"Created authenticated Supabase client with JWT token (token length: {len(token)})")
    except Exception as e:
        # If authentication fails, log and return unauthenticated client
        logger.error(f"Failed to authenticate Supabase client with JWT token: {e}")
        return db_client
    
    return client

def get_authenticated_client_dep(request: Request) -> Client:
    """
    FastAPI dependency that provides an authenticated Supabase client.
    Use this instead of calling get_authenticated_client() manually.
    
    Example:
        @router.get("/endpoint")
        async def my_endpoint(
            client: Client = Depends(get_authenticated_client_dep),
            current_user: Dict = Depends(require_auth)
        ):
            # Use client for database operations
            ...
    """
    return get_authenticated_client(request)

async def test_database_connection():
    """Test the database connection and print result"""
    try:
        # Test connection with a simple query
        result = db_client.auth.get_session()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_connection_sync():
    """Synchronous wrapper to test database connection"""
    try:
        # Try a simple operation to test connection
        # Using the client to get session info (doesn't require auth)
        session = db_client.auth.get_session()
        logger.info("Database connection successful!")
        return True
    except Exception as e:
        logger.warning(f"Database connection test failed (this is OK at startup): {e}")
        return False

# Test connection when module is imported (non-blocking)
# Don't raise exceptions here - let the app start and fail gracefully on first request if needed
try:
    test_connection_sync()
except Exception as e:
    logger.warning(f"Initial database connection test failed: {e}. App will continue to start.")
