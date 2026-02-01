import logging
import os
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException
from core.safe_errors import log_exception_if_dev
from typing import Dict, Any, Optional
from supabase import Client
from schemas.invite import (
    GenerateInviteResponse,
    ValidateInviteResponse,
    AcceptInviteResponse
)
from db.db_session import db_admin

logger = logging.getLogger(__name__)

# Secret for signing invite tokens (in production, use environment variable)
INVITE_SECRET = os.getenv("INVITE_SECRET", "dev-invite-secret-change-in-production")


async def _send_notification_email(notification_data: Dict[str, Any], recipient_user_id: str, recipient_name: str, client: Client = None):
    """Helper function to send email after notification creation"""
    try:
        from services.notifications.notifications_service import NotificationsController
        # Get recipient email
        recipient_email = None
        if client:
            try:
                user_result = client.table('users').select('email').eq('user_id', recipient_user_id).single().execute()
                if user_result.data:
                    recipient_email = user_result.data.get('email')
            except:
                pass
        
        await NotificationsController.send_notification_email(
            notification_data=notification_data,
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            client=client
        )
    except Exception as e:
        log_exception_if_dev(logger, "Failed to send notification email", e)


class InviteController:
    """Controller for invite-related operations"""
    
    @staticmethod
    async def generate_invite_link(user_id: str, client: Client = None) -> GenerateInviteResponse:
        """Generate an invite link for a creative to invite clients
        
        Args:
            user_id: The user ID to generate invite link for
            client: Authenticated Supabase client (required, respects RLS policies)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            logger.info(f"Starting invite generation for user: {user_id}")
            
            # Get user roles from database (using authenticated client - respects RLS)
            user_response = client.table("users") \
                .select("roles") \
                .eq("user_id", user_id) \
                .single() \
                .execute()

            if not user_response.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_roles = user_response.data.get('roles', [])
            logger.info(f"User roles: {user_roles}")
            
            if 'creative' not in user_roles:
                raise HTTPException(status_code=403, detail="Only creatives can generate invite links")
            
            invite_payload = {
                'creative_user_id': user_id,
                'exp': datetime.utcnow() + timedelta(days=30),  # Expires in 30 days
                'iat': datetime.utcnow(),
                'type': 'client_invite'
            }
            
            invite_token = jwt.encode(invite_payload, INVITE_SECRET, algorithm='HS256')
            logger.info(f"JWT token created: {invite_token[:20]}...")
            
            # Generate invite link
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            # Remove trailing slash from base_url to prevent double slashes
            base_url = base_url.rstrip('/')
            invite_link = f"{base_url}/invite/{invite_token}"
            logger.info(f"Invite link generated: {invite_link}")
            
            return GenerateInviteResponse(
                success=True,
                invite_link=invite_link,
                expires_at=invite_payload['exp'].isoformat(),
                message="Invite link generated successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error generating invite link", e)
            raise HTTPException(status_code=500, detail="Failed to generate invite link")
    
    @staticmethod
    async def validate_invite_token(invite_token: str, user_info: Optional[Dict[str, Any]] = None, client: Client = None) -> ValidateInviteResponse:
        """Validate an invite token and return creative information
        
        Args:
            invite_token: The invite token to validate
            user_info: Optional user information if user is authenticated
            client: Supabase client (required, always provided from API layer)
                    - Authenticated client if user has token
                    - Anon client (db_client) if no token
                    - Both respect RLS policies
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Decode and validate the token
            payload = jwt.decode(invite_token, INVITE_SECRET, algorithms=['HS256'])
            
            if payload.get('type') != 'client_invite':
                raise HTTPException(status_code=400, detail="Invalid invite type")
            
            creative_user_id = payload.get('creative_user_id')
            if not creative_user_id:
                raise HTTPException(status_code=400, detail="Invalid invite token")
            
            logger.info(f"Looking up creative with user_id: {creative_user_id}")
            
            # Get creative information using service role client for public endpoint
            # This ensures the query works regardless of RLS policies since this is a public endpoint
            # We're only reading public fields (display_name, title, user_id) which are safe to expose
            try:
                creative_response = db_admin.table("creatives") \
                    .select("display_name, title, user_id") \
                    .eq("user_id", creative_user_id) \
                    .execute()
                
                logger.info(f"Creative query response: {creative_response.data}")
            except Exception as query_error:
                log_exception_if_dev(logger, "Error querying creatives table", query_error)
                raise HTTPException(status_code=500, detail="Failed to validate invite token")
            
            if not creative_response.data or len(creative_response.data) == 0:
                logger.warning(f"Creative not found for user_id: {creative_user_id}")
                raise HTTPException(status_code=404, detail="Creative not found")
            
            if len(creative_response.data) > 1:
                # This shouldn't happen, but handle it gracefully
                raise HTTPException(status_code=500, detail="Multiple creatives found with same user_id")
            
            creative = creative_response.data[0]
            
            return ValidateInviteResponse(
                success=True,
                valid=True,
                creative={
                    "user_id": creative["user_id"],
                    "display_name": creative["display_name"],
                    "title": creative["title"]
                },
                expires_at=datetime.fromtimestamp(payload['exp']).isoformat(),
                user=user_info
            )
            
        except jwt.ExpiredSignatureError:
            return ValidateInviteResponse(
                success=False,
                valid=False,
                message="Invite link has expired"
            )
        except jwt.InvalidTokenError:
            return ValidateInviteResponse(
                success=False,
                valid=False,
                message="Invalid invite link"
            )
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error validating invite token", e)
            raise HTTPException(status_code=500, detail="Failed to validate invite token")
    
    @staticmethod
    async def accept_invite(invite_token: str, client_user_id: str, client: Client = None) -> AcceptInviteResponse:
        """Accept an invite and create the creative-client relationship
        
        Args:
            invite_token: The invite token to accept
            client_user_id: The client user ID accepting the invite
            client: Authenticated Supabase client (required, respects RLS policies)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            logger.info(f"Starting invite acceptance for token: {invite_token[:20]}...")
            
            # Validate the token first
            payload = jwt.decode(invite_token, INVITE_SECRET, algorithms=['HS256'])
            logger.info(f"Token payload: {payload}")
            
            if payload.get('type') != 'client_invite':
                raise HTTPException(status_code=400, detail="Invalid invite type")
            
            creative_user_id = payload.get('creative_user_id')
            if not creative_user_id:
                raise HTTPException(status_code=400, detail="Invalid invite token")
            
            logger.info(f"Creative user ID: {creative_user_id}, Client user ID: {client_user_id}")
            
            # Get user roles from database (using authenticated client - respects RLS)
            user_response = client.table("users") \
                .select("roles") \
                .eq("user_id", client_user_id) \
                .single() \
                .execute()
            
            logger.info(f"User response: {user_response.data}")
            
            if not user_response.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_roles = user_response.data.get('roles', [])
            logger.info(f"User roles: {user_roles}")
            
            if 'client' not in user_roles:
                logger.info(f"User does not have client role, returning needs_client_role=True")
                return AcceptInviteResponse(
                    success=False,
                    needs_client_role=True,
                    message="User needs to add client role first",
                    creative_user_id=creative_user_id
                )
            
            # Check if relationship already exists (using authenticated client - respects RLS)
            existing_relationship = client.table("creative_client_relationships") \
                .select("id") \
                .eq("creative_user_id", creative_user_id) \
                .eq("client_user_id", client_user_id) \
                .execute()
            
            logger.info(f"Existing relationship check: {existing_relationship.data}")
            
            if existing_relationship.data:
                logger.info(f"Relationship already exists, returning success")
                return AcceptInviteResponse(
                    success=True,
                    message="You are already connected with this creative",
                    relationship_exists=True
                )
            
            # Create the creative-client relationship
            relationship_data = {
                "creative_user_id": creative_user_id,
                "client_user_id": client_user_id,
                "status": "inactive",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Creating relationship with data: {relationship_data}")
            
            # Create relationship using service role client to bypass RLS
            # This is safe because:
            # 1. User is authenticated and has client role
            # 2. Invite token has been validated
            # 3. We're only creating a relationship between the creative and client specified in the token
            result = db_admin.table("creative_client_relationships") \
                .insert(relationship_data) \
                .execute()
            
            logger.info(f"Insert result: {result.data}")
            
            if result.data:
                logger.info(f"Successfully created relationship")
                
                # Get client display name for notification (using authenticated client - respects RLS)
                client_response = client.table("clients") \
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
                    # Create notification using admin client to bypass RLS
                    # We need admin privileges because we're creating a notification for the creative user
                    # (the client user doesn't have permission to create notifications for other users)
                    notification_result = db_admin.table("notifications") \
                        .insert(notification_data) \
                        .execute()
                    logger.info(f"Notification created: {notification_result.data}")
                    
                    # Send email notification
                    if notification_result.data:
                        # Get creative name
                        try:
                            creative_result = db_admin.table('creatives').select('display_name').eq('user_id', creative_user_id).single().execute()
                            creative_name = creative_result.data.get('display_name', 'Creative') if creative_result.data else 'Creative'
                            await _send_notification_email(notification_data, creative_user_id, creative_name, db_admin)
                        except Exception as email_error:
                            log_exception_if_dev(logger, "Failed to send new client email", email_error)
                except Exception as notif_error:
                    log_exception_if_dev(logger, "Failed to create notification", notif_error)
                    # Don't fail the invite acceptance if notification creation fails

                return AcceptInviteResponse(
                    success=True,
                    message="Successfully connected with creative!",
                    relationship_id=result.data[0]["id"]
                )
            else:
                logger.error(f"Failed to create relationship - no data returned")
                raise HTTPException(status_code=500, detail="Failed to create relationship")
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="Invite link has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=400, detail="Invalid invite link")
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error accepting invite", e)
            raise HTTPException(status_code=500, detail="Failed to accept invite")

    @staticmethod
    async def accept_invite_after_role_setup(invite_token: str, client_user_id: str, client: Client = None) -> AcceptInviteResponse:
        """Accept an invite after user has set up their client role
        
        Args:
            invite_token: The invite token to accept
            client_user_id: The client user ID accepting the invite
            client: Authenticated Supabase client (required, respects RLS policies)
        """
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Validate the token first
            payload = jwt.decode(invite_token, INVITE_SECRET, algorithms=['HS256'])
            
            if payload.get('type') != 'client_invite':
                raise HTTPException(status_code=400, detail="Invalid invite type")
            
            creative_user_id = payload.get('creative_user_id')
            if not creative_user_id:
                raise HTTPException(status_code=400, detail="Invalid invite token")
            
            # Get user roles from database to verify client role was added (using authenticated client - respects RLS)
            user_response = client.table("users") \
                .select("roles") \
                .eq("user_id", client_user_id) \
                .single() \
                .execute()
            
            if not user_response.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_roles = user_response.data.get('roles', [])
            if 'client' not in user_roles:
                raise HTTPException(status_code=400, detail="User still doesn't have client role")
            
            # Verify client profile exists before creating relationship
            client_profile_check = client.table("clients") \
                .select("user_id") \
                .eq("user_id", client_user_id) \
                .execute()
            
            if not client_profile_check.data:
                raise HTTPException(
                    status_code=400, 
                    detail="Client profile not found. Please ensure your profile is set up before accepting invites."
                )
            
            # Check if relationship already exists (using authenticated client - respects RLS)
            existing_relationship = client.table("creative_client_relationships") \
                .select("id") \
                .eq("creative_user_id", creative_user_id) \
                .eq("client_user_id", client_user_id) \
                .execute()
            
            if existing_relationship.data:
                return AcceptInviteResponse(
                    success=True,
                    message="You are already connected with this creative",
                    relationship_exists=True
                )
            
            # Create the creative-client relationship
            relationship_data = {
                "creative_user_id": creative_user_id,
                "client_user_id": client_user_id,
                "status": "inactive",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Creating relationship with data: {relationship_data}")
            
            # Create relationship using service role client to bypass RLS
            # This is safe because:
            # 1. User is authenticated and has client role
            # 2. Invite token has been validated
            # 3. We're only creating a relationship between the creative and client specified in the token
            result = db_admin.table("creative_client_relationships") \
                .insert(relationship_data) \
                .execute()
            
            if result.data:
                # Get client display name for notification (using authenticated client - respects RLS)
                try:
                    client_response = client.table("clients") \
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
                    # Create notification using admin client to bypass RLS
                    # We need admin privileges because we're creating a notification for the creative user
                    # (the client user doesn't have permission to create notifications for other users)
                    notification_result = db_admin.table("notifications") \
                        .insert(notification_data) \
                        .execute()
                    logger.info(f"Notification created: {notification_result.data}")
                    
                    # Send email notification
                    if notification_result.data:
                        # Get creative name
                        try:
                            creative_result = db_admin.table('creatives').select('display_name').eq('user_id', creative_user_id).single().execute()
                            creative_name = creative_result.data.get('display_name', 'Creative') if creative_result.data else 'Creative'
                            await _send_notification_email(notification_data, creative_user_id, creative_name, db_admin)
                        except Exception as email_error:
                            log_exception_if_dev(logger, "Failed to send new client email", email_error)
                except Exception as notif_error:
                    log_exception_if_dev(logger, "Failed to create notification", notif_error)
                    # Don't fail the invite acceptance if notification creation fails

                return AcceptInviteResponse(
                    success=True,
                    message="Successfully connected with creative after role setup!",
                    relationship_id=result.data[0]["id"]
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to create relationship")
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="Invite link has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=400, detail="Invalid invite link")
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error accepting invite after role setup", e)
            raise HTTPException(status_code=500, detail="Failed to accept invite after role setup")

