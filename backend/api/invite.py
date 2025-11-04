from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
from core.verify import require_auth
from typing import Optional, Dict, Any
import uuid
import jwt
from datetime import datetime, timedelta
from db.db_session import db_admin
import os
from core.limiter import limiter

router = APIRouter(prefix="/invite", tags=["invite"])

# Secret for signing invite tokens (in production, use environment variable)
INVITE_SECRET = os.getenv("INVITE_SECRET", "dev-invite-secret-change-in-production")

@router.post("/generate")
@limiter.limit("2 per second")
async def generate_invite_link(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Generate an invite link for a creative to invite clients
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        print("🔍 Starting invite generation...")
        
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        user_id = current_user.get('sub')
        print(f"🔍 User ID from token: {user_id}")
        
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
        # Remove trailing slash from base_url to prevent double slashes
        base_url = base_url.rstrip('/')
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
@limiter.limit("2 per second")
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
            .execute()
        
        if not creative_response.data or len(creative_response.data) == 0:
            raise HTTPException(status_code=404, detail="Creative not found")
        
        if len(creative_response.data) > 1:
            # This shouldn't happen, but handle it gracefully
            raise HTTPException(status_code=500, detail="Multiple creatives found with same user_id")
        
        creative = creative_response.data[0]
        
        # Check if there's an authenticated user and their roles
        user_info = None
        if request.state.user:
            user_id = request.state.user.get('sub')
            if user_id:
                # Get user roles from database
                try:
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
                except Exception:
                    # User not found in database, continue without user_info
                    pass
        
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
@limiter.limit("2 per second")
async def accept_invite(
    invite_token: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Accept an invite and create the creative-client relationship
    Requires authentication - will return 401 if not authenticated.
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
        
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        client_user_id = current_user.get('sub')
        
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
            "status": "inactive",
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
            
            # Get client display name for notification
            client_response = db_admin.table("clients") \
                .select("display_name") \
                .eq("user_id", client_user_id) \
                .single() \
                .execute()
            
            client_display_name = client_response.data.get("display_name", "A client") if client_response.data else "A client"
            
            # Create notification for creative
            notification_data = {
                "recipient_user_id": creative_user_id,
                "notification_type": "new_client_added",
                "title": "New Client Added",
                "message": f"{client_display_name} has added you as their creative",
                "is_read": False,
                "related_user_id": client_user_id,
                "related_entity_id": result.data[0]["id"],
                "related_entity_type": "relationship",
                "target_roles": ["creative"],
                "metadata": {
                    "client_display_name": client_display_name,
                    "relationship_id": str(result.data[0]["id"])
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            try:
                notification_result = db_admin.table("notifications") \
                    .insert(notification_data) \
                    .execute()
                print(f"[ACCEPT_INVITE] Notification created: {notification_result.data}")
            except Exception as notif_error:
                print(f"[ACCEPT_INVITE] Failed to create notification: {notif_error}")
                # Don't fail the invite acceptance if notification creation fails
            
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
@limiter.limit("2 per second")
async def accept_invite_after_role_setup(
    invite_token: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth)
):
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
        
        # Get user ID from authenticated user (guaranteed by require_auth dependency)
        client_user_id = current_user.get('sub')
        
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
            "status": "inactive",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = db_admin.table("creative_client_relationships") \
            .insert(relationship_data) \
            .execute()
        
        if result.data:
            # Get client display name for notification
            try:
                client_response = db_admin.table("clients") \
                    .select("display_name") \
                    .eq("user_id", client_user_id) \
                    .execute()
                
                client_display_name = client_response.data[0].get("display_name", "A client") if client_response.data and len(client_response.data) > 0 else "A client"
            except Exception:
                # If client profile not found, use default name
                client_display_name = "A client"
            
            # Create notification for creative
            notification_data = {
                "recipient_user_id": creative_user_id,
                "notification_type": "new_client_added",
                "title": "New Client Added",
                "message": f"{client_display_name} has added you as their creative",
                "is_read": False,
                "related_user_id": client_user_id,
                "related_entity_id": result.data[0]["id"],
                "related_entity_type": "relationship",
                "target_roles": ["creative"],
                "metadata": {
                    "client_display_name": client_display_name,
                    "relationship_id": str(result.data[0]["id"])
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            try:
                notification_result = db_admin.table("notifications") \
                    .insert(notification_data) \
                    .execute()
                print(f"[ACCEPT_INVITE_AFTER_ROLE_SETUP] Notification created: {notification_result.data}")
            except Exception as notif_error:
                print(f"[ACCEPT_INVITE_AFTER_ROLE_SETUP] Failed to create notification: {notif_error}")
                # Don't fail the invite acceptance if notification creation fails
            
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
