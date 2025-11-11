import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import Request, Depends
from typing import Optional

load_dotenv() 

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase configuration")

db_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
db_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
    
    # Create client and authenticate with JWT token using postgrest.auth()
    # This is the proper way to set JWT token for RLS in Supabase Python client
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Use the auth() method to set the bearer token for RLS
    # This authenticates the client with the user's JWT token
    try:
        client.postgrest.auth(token)
    except (AttributeError, TypeError, ValueError) as e:
        # If authentication fails, log and return unauthenticated client
        # This will cause RLS to fail, but at least we won't crash
        import logging
        logging.error(f"Failed to authenticate Supabase client with JWT token: {e}")
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
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Test connection when module is imported
test_connection_sync()
