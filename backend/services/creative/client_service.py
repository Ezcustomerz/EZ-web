"""Client service for creative-client relationships"""
from fastapi import HTTPException
from schemas.creative import CreativeClientsListResponse, CreativeClientResponse
from supabase import Client


class ClientService:
    """Service for handling creative client operations"""
    
    @staticmethod
    async def get_creative_clients(user_id: str, client: Client) -> CreativeClientsListResponse:
        """Get all clients associated with the creative - optimized with batch queries
        
        Args:
            user_id: The creative user ID
            client: Authenticated Supabase client (required, respects RLS policies)
            
        Raises:
            ValueError: If client is not provided
        """
        if not client:
            raise ValueError("Authenticated client is required for this operation")
        
        try:
            # Get creative_client_relationships for this creative
            relationships_result = client.table('creative_client_relationships').select(
                'id, status, total_spent, projects_count, client_user_id'
            ).eq('creative_user_id', user_id).order('updated_at', desc=True).execute()
            
            if not relationships_result.data:
                return CreativeClientsListResponse(clients=[], total_count=0)
            
            client_user_ids = [rel['client_user_id'] for rel in relationships_result.data]
            
            # Batch fetch client and user data to avoid N+1 queries
            clients_result = client.table('clients').select(
                'user_id, display_name, email, title'
            ).in_('user_id', client_user_ids).execute()
            
            users_result = client.table('users').select(
                'user_id, name, profile_picture_url'
            ).in_('user_id', client_user_ids).execute()
            
            # Create lookup maps
            client_data_map = {c['user_id']: c for c in clients_result.data}
            user_data_map = {u['user_id']: u for u in users_result.data}
            
            clients = []
            for relationship in relationships_result.data:
                client_user_id = relationship['client_user_id']
                
                client_data = client_data_map.get(client_user_id)
                user_data = user_data_map.get(client_user_id)
                
                if not client_data or not user_data:
                    continue  # Skip if client or user data not found
                
                # Determine contact type and primary contact
                contact = client_data.get('email', '')
                contact_type = 'email'
                
                if not contact:
                    contact = 'No contact info'
                    contact_type = 'email'
                
                # Use display_name if available, otherwise use name
                client_name = client_data.get('display_name') or user_data.get('name', 'Unknown Client')
                
                client = CreativeClientResponse(
                    id=relationship['id'],
                    name=client_name,
                    contact=contact,
                    contactType=contact_type,
                    status=relationship.get('status', 'inactive'),
                    totalSpent=float(relationship.get('total_spent', 0)),
                    projects=int(relationship.get('projects_count', 0)),
                    profile_picture_url=user_data.get('profile_picture_url'),
                    title=client_data.get('title')
                )
                clients.append(client)
            
            return CreativeClientsListResponse(
                clients=clients,
                total_count=len(clients)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative clients: {str(e)}")

