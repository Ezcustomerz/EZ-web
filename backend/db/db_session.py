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
