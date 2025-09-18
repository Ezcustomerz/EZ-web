from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
import uuid
import jwt
from datetime import datetime, timedelta
from db.db_session import db_admin
from typing import Optional
import os

router = APIRouter(prefix="/invite", tags=["invite"])

# Secret for signing invite tokens (in production, use environment variable)
INVITE_SECRET = os.getenv("INVITE_SECRET", "dev-invite-secret-change-in-production")

@router.post("/generate")
async def generate_invite_link(request: Request):
    """
    Generate an invite link for a creative to invite clients
    """
    try:
        print("🔍 Starting invite generation...")
        
        # Get user from request state (set by middleware)
        print(f"🔍 Request state user: {hasattr(request.state, 'user')}")
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_id = request.state.user.get('sub')
        print(f"🔍 User ID from token: {user_id}")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Get user roles from database
        print("🔍 Querying user roles from database...")
        user_response = db_admin.table("users") \
            .select("roles") \
            .eq("user_id", user_id) \
            .single() \
            .execute()

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_roles = user_response.data.get('roles', [])
        print(f"🔍 User roles: {user_roles}")
        if 'creative' not in user_roles:
            raise HTTPException(status_code=403, detail="Only creatives can generate invite links")
        
        invite_payload = {
            'creative_user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=30),  # Expires in 30 days
            'iat': datetime.utcnow(),
            'type': 'client_invite'
        }
        
        invite_token = jwt.encode(invite_payload, INVITE_SECRET, algorithm='HS256')
        print(f"🔍 JWT token created: {invite_token[:20]}...")
        
        # Generate invite link
        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        invite_link = f"{base_url}/invite/{invite_token}"
        print(f"🔍 Invite link generated: {invite_link}")
        
        return {
            "success": True,
            "invite_link": invite_link,
            "expires_at": invite_payload['exp'].isoformat(),
            "message": "Invite link generated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating invite link: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate invite link: {str(e)}")

@router.get("/validate/{invite_token}")
async def validate_invite_token(invite_token: str, request: Request):
    """
    Validate an invite token and return creative information
    """
    try:
        # Decode and validate the token
        payload = jwt.decode(invite_token, INVITE_SECRET, algorithms=['HS256'])
        
        if payload.get('type') != 'client_invite':
            raise HTTPException(status_code=400, detail="Invalid invite type")
        
        creative_user_id = payload.get('creative_user_id')
        if not creative_user_id:
            raise HTTPException(status_code=400, detail="Invalid invite token")
        
        # Get creative information
        creative_response = db_admin.table("creatives") \
            .select("display_name, title, user_id") \
            .eq("user_id", creative_user_id) \
            .single() \
            .execute()
        
        if not creative_response.data:
            raise HTTPException(status_code=404, detail="Creative not found")
        
        creative = creative_response.data
        
        # Check if there's an authenticated user and their roles
        user_info = None
        if request.state.user:
            user_id = request.state.user.get('sub')
            if user_id:
                # Get user roles from database
                user_response = db_admin.table("users") \
                    .select("roles") \
                    .eq("user_id", user_id) \
                    .single() \
                    .execute()
                
                if user_response.data:
                    user_info = {
                        "user_id": user_id,
                        "roles": user_response.data.get('roles', []),
                        "has_client_role": 'client' in user_response.data.get('roles', [])
                    }
        
        return {
            "success": True,
            "valid": True,
            "creative": {
                "user_id": creative["user_id"],
                "display_name": creative["display_name"],
                "title": creative["title"]
            },
            "expires_at": datetime.fromtimestamp(payload['exp']).isoformat(),
            "user": user_info
        }
        
    except jwt.ExpiredSignatureError:
        return {
            "success": False,
            "valid": False,
            "message": "Invite link has expired"
        }
    except jwt.InvalidTokenError:
        return {
            "success": False,
            "valid": False,
            "message": "Invalid invite link"
        }
    except Exception as e:
        print(f"Error validating invite token: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate invite token")

@router.post("/accept/{invite_token}")
async def accept_invite(invite_token: str, request: Request):
    """
    Accept an invite and create the creative-client relationship
    """
    try:
        print(f"[ACCEPT_INVITE] Starting invite acceptance for token: {invite_token[:20]}...")
        
        # Validate the token first
        payload = jwt.decode(invite_token, INVITE_SECRET, algorithms=['HS256'])
        print(f"[ACCEPT_INVITE] Token payload: {payload}")
        
        if payload.get('type') != 'client_invite':
            raise HTTPException(status_code=400, detail="Invalid invite type")
        
        creative_user_id = payload.get('creative_user_id')
        if not creative_user_id:
            raise HTTPException(status_code=400, detail="Invalid invite token")
        
        # Get user from request state (set by middleware)
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        client_user_id = request.state.user.get('sub')
        if not client_user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        print(f"[ACCEPT_INVITE] Creative user ID: {creative_user_id}, Client user ID: {client_user_id}")
        
        # Get user roles from database
        user_response = db_admin.table("users") \
            .select("roles") \
            .eq("user_id", client_user_id) \
            .single() \
            .execute()
        
        print(f"[ACCEPT_INVITE] User response: {user_response.data}")
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_roles = user_response.data.get('roles', [])
        print(f"[ACCEPT_INVITE] User roles: {user_roles}")
        
        if 'client' not in user_roles:
            print(f"[ACCEPT_INVITE] User does not have client role, returning needs_client_role=True")
            return {
                "success": False,
                "needs_client_role": True,
                "message": "User needs to add client role first",
                "creative_user_id": creative_user_id
            }
        
        # Check if relationship already exists
        existing_relationship = db_admin.table("creative_client_relationships") \
            .select("id") \
            .eq("creative_user_id", creative_user_id) \
            .eq("client_user_id", client_user_id) \
            .execute()
        
        print(f"[ACCEPT_INVITE] Existing relationship check: {existing_relationship.data}")
        
        if existing_relationship.data:
            print(f"[ACCEPT_INVITE] Relationship already exists, returning success")
            return {
                "success": True,
                "message": "You are already connected with this creative",
                "relationship_exists": True
            }
        
        # Create the creative-client relationship
        relationship_data = {
            "creative_user_id": creative_user_id,
            "client_user_id": client_user_id,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        print(f"[ACCEPT_INVITE] Creating relationship with data: {relationship_data}")
        
        result = db_admin.table("creative_client_relationships") \
            .insert(relationship_data) \
            .execute()
        
        print(f"[ACCEPT_INVITE] Insert result: {result.data}")
        
        if result.data:
            print(f"[ACCEPT_INVITE] Successfully created relationship")
            return {
                "success": True,
                "message": "Successfully connected with creative!",
                "relationship_id": result.data[0]["id"]
            }
        else:
            print(f"[ACCEPT_INVITE] Failed to create relationship - no data returned")
            raise HTTPException(status_code=500, detail="Failed to create relationship")
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Invite link has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid invite link")
    except Exception as e:
        print(f"Error accepting invite: {e}")
        raise HTTPException(status_code=500, detail="Failed to accept invite")

@router.post("/accept-after-role-setup/{invite_token}")
async def accept_invite_after_role_setup(invite_token: str, request: Request):
    """
    Accept an invite after user has set up their client role
    This is called after the user completes client role setup
    """
    try:
        # Validate the token first
        payload = jwt.decode(invite_token, INVITE_SECRET, algorithms=['HS256'])
        
        if payload.get('type') != 'client_invite':
            raise HTTPException(status_code=400, detail="Invalid invite type")
        
        creative_user_id = payload.get('creative_user_id')
        if not creative_user_id:
            raise HTTPException(status_code=400, detail="Invalid invite token")
        
        # Get user from request state (set by middleware)
        if not request.state.user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        client_user_id = request.state.user.get('sub')
        if not client_user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Get user roles from database to verify client role was added
        user_response = db_admin.table("users") \
            .select("roles") \
            .eq("user_id", client_user_id) \
            .single() \
            .execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_roles = user_response.data.get('roles', [])
        if 'client' not in user_roles:
            raise HTTPException(status_code=400, detail="User still doesn't have client role")
        
        # Check if relationship already exists
        existing_relationship = db_admin.table("creative_client_relationships") \
            .select("id") \
            .eq("creative_user_id", creative_user_id) \
            .eq("client_user_id", client_user_id) \
            .execute()
        
        if existing_relationship.data:
            return {
                "success": True,
                "message": "You are already connected with this creative",
                "relationship_exists": True
            }
        
        # Create the creative-client relationship
        relationship_data = {
            "creative_user_id": creative_user_id,
            "client_user_id": client_user_id,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = db_admin.table("creative_client_relationships") \
            .insert(relationship_data) \
            .execute()
        
        if result.data:
            return {
                "success": True,
                "message": "Successfully connected with creative after role setup!",
                "relationship_id": result.data[0]["id"]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create relationship")
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Invite link has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid invite link")
    except Exception as e:
        print(f"Error accepting invite after role setup: {e}")
        raise HTTPException(status_code=500, detail="Failed to accept invite after role setup")
