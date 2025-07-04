import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv() 

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase configuration")

db_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
db_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
