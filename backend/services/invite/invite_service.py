from fastapi import HTTPException
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import jwt
import os
import logging
from db.db_session import db_admin
from schemas.invite import (
    GenerateInviteResponse,
    ValidateInviteResponse,
    AcceptInviteResponse
)

logger = logging.getLogger(__name__)

# Secret for signing invite tokens (in production, use environment variable)
INVITE_SECRET = os.getenv("INVITE_SECRET", "dev-invite-secret-change-in-production")


class InviteController:
    """Controller for invite-related operations"""
    
    @staticmethod
    async def generate_invite_link(user_id: str) -> GenerateInviteResponse:
        """Generate an invite link for a creative to invite clients"""
        try:
            logger.info(f"Starting invite generation for user: {user_id}")
            
            # Get user roles from database
            user_response = db_admin.table("users") \
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
            logger.error(f"Error generating invite link: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to generate invite link: {str(e)}")
    
    @staticmethod
    async def validate_invite_token(invite_token: str, user_info: Optional[Dict[str, Any]] = None) -> ValidateInviteResponse:
        """Validate an invite token and return creative information"""
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
            logger.error(f"Error validating invite token: {e}")
            raise HTTPException(status_code=500, detail="Failed to validate invite token")
    
    @staticmethod
    async def accept_invite(invite_token: str, client_user_id: str) -> AcceptInviteResponse:
        """Accept an invite and create the creative-client relationship"""
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
            
            # Get user roles from database
            user_response = db_admin.table("users") \
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
            
            # Check if relationship already exists
            existing_relationship = db_admin.table("creative_client_relationships") \
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
            
            result = db_admin.table("creative_client_relationships") \
                .insert(relationship_data) \
                .execute()
            
            logger.info(f"Insert result: {result.data}")
            
            if result.data:
                logger.info(f"Successfully created relationship")
                
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
                    logger.info(f"Notification created: {notification_result.data}")
                except Exception as notif_error:
                    logger.error(f"Failed to create notification: {notif_error}")
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
            logger.error(f"Error accepting invite: {e}")
            raise HTTPException(status_code=500, detail="Failed to accept invite")
    
    @staticmethod
    async def accept_invite_after_role_setup(invite_token: str, client_user_id: str) -> AcceptInviteResponse:
        """Accept an invite after user has set up their client role"""
        try:
            # Validate the token first
            payload = jwt.decode(invite_token, INVITE_SECRET, algorithms=['HS256'])
            
            if payload.get('type') != 'client_invite':
                raise HTTPException(status_code=400, detail="Invalid invite type")
            
            creative_user_id = payload.get('creative_user_id')
            if not creative_user_id:
                raise HTTPException(status_code=400, detail="Invalid invite token")
            
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
                    logger.info(f"Notification created: {notification_result.data}")
                except Exception as notif_error:
                    logger.error(f"Failed to create notification: {notif_error}")
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
            logger.error(f"Error accepting invite after role setup: {e}")
            raise HTTPException(status_code=500, detail="Failed to accept invite after role setup")

