"""Bundle service for creative bundles"""
from fastapi import HTTPException
from db.db_session import db_admin
from schemas.creative import (
    CreateBundleRequest, CreateBundleResponse,
    UpdateBundleRequest, UpdateBundleResponse, DeleteBundleResponse,
    CreativeBundleResponse, CreativeBundlesListResponse, BundleServiceResponse
)
from supabase import Client


class BundleService:
    """Service for handling creative bundle operations"""
    
    @staticmethod
    async def create_bundle(user_id: str, bundle_request: CreateBundleRequest, client: Client = None) -> CreateBundleResponse:
        """Create a new bundle for the creative"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Validate that the user has a creative profile
            creative_result = client.table('creatives').select('user_id').eq('user_id', user_id).single().execute()
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found. Please complete your creative setup first.")
            
            # Validate that all services exist and belong to the user
            if not bundle_request.service_ids or len(bundle_request.service_ids) < 2:
                raise HTTPException(status_code=422, detail="Bundle must contain at least 2 services")
            
            # Check that all services exist and belong to the user
            services_result = client.table('creative_services').select(
                'id, title, price, status'
            ).eq('creative_user_id', user_id).eq('is_active', True).in_('id', bundle_request.service_ids).execute()
            
            if not services_result.data or len(services_result.data) != len(bundle_request.service_ids):
                raise HTTPException(status_code=422, detail="One or more services not found or don't belong to you")
            
            # Validate that all services are either Public or Bundle-Only
            for service in services_result.data:
                if service['status'] not in ['Public', 'Bundle-Only']:
                    raise HTTPException(status_code=422, detail=f"Service '{service['title']}' cannot be included in bundles (must be Public or Bundle-Only)")
            
            # Calculate total services price
            total_services_price = sum(float(service['price']) for service in services_result.data)
            
            # Calculate final price based on pricing option
            if bundle_request.pricing_option == 'fixed':
                if bundle_request.fixed_price is None or bundle_request.fixed_price < 0:
                    raise HTTPException(status_code=422, detail="Fixed price cannot be negative")
                final_price = bundle_request.fixed_price
            else:  # discount
                if bundle_request.discount_percentage is None or bundle_request.discount_percentage < 0 or bundle_request.discount_percentage > 100:
                    raise HTTPException(status_code=422, detail="Discount percentage must be between 0 and 100")
                discount_amount = total_services_price * (bundle_request.discount_percentage / 100)
                final_price = total_services_price - discount_amount
            
            # Prepare bundle data
            bundle_data = {
                'creative_user_id': user_id,
                'title': bundle_request.title.strip(),
                'description': bundle_request.description.strip(),
                'color': bundle_request.color,
                'status': bundle_request.status,
                'pricing_option': bundle_request.pricing_option,
                'fixed_price': bundle_request.fixed_price,
                'discount_percentage': bundle_request.discount_percentage,
                'is_active': True
            }
            
            # Insert the bundle
            bundle_result = client.table('creative_bundles').insert(bundle_data).execute()
            
            if not bundle_result.data:
                raise HTTPException(status_code=500, detail="Failed to create bundle")
            
            bundle_id = bundle_result.data[0]['id']
            
            # Insert bundle-service relationships
            bundle_services_data = [
                {'bundle_id': bundle_id, 'service_id': service_id}
                for service_id in bundle_request.service_ids
            ]
            
            bundle_services_result = client.table('bundle_services').insert(bundle_services_data).execute()
            
            if not bundle_services_result.data:
                # If bundle services insertion fails, clean up the bundle
                client.table('creative_bundles').delete().eq('id', bundle_id).execute()
                raise HTTPException(status_code=500, detail="Failed to associate services with bundle")
            
            return CreateBundleResponse(
                success=True,
                message="Bundle created successfully",
                bundle_id=bundle_id
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create bundle: {str(e)}")

    @staticmethod
    async def update_bundle(user_id: str, bundle_id: str, bundle_request: UpdateBundleRequest, client: Client = None) -> UpdateBundleResponse:
        """Update an existing bundle"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Verify the bundle exists and belongs to the user
            bundle_result = client.table('creative_bundles').select(
                'id, creative_user_id, is_active'
            ).eq('id', bundle_id).single().execute()

            if not bundle_result.data:
                raise HTTPException(status_code=404, detail="Bundle not found")

            if bundle_result.data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to edit this bundle")

            if not bundle_result.data['is_active']:
                raise HTTPException(status_code=400, detail="Cannot edit a deleted bundle")

            # Prepare update data - only include fields that are provided
            update_data = {}

            if bundle_request.title is not None:
                update_data['title'] = bundle_request.title.strip()

            if bundle_request.description is not None:
                update_data['description'] = bundle_request.description.strip()

            if bundle_request.color is not None:
                update_data['color'] = bundle_request.color

            if bundle_request.status is not None:
                update_data['status'] = bundle_request.status

            if bundle_request.pricing_option is not None:
                update_data['pricing_option'] = bundle_request.pricing_option

            if bundle_request.fixed_price is not None:
                update_data['fixed_price'] = bundle_request.fixed_price

            if bundle_request.discount_percentage is not None:
                update_data['discount_percentage'] = bundle_request.discount_percentage

            # If service_ids are provided, validate and update them
            if bundle_request.service_ids is not None:
                if len(bundle_request.service_ids) < 2:
                    raise HTTPException(status_code=422, detail="Bundle must contain at least 2 services")

                # Check that all services exist and belong to the user
                services_result = client.table('creative_services').select(
                    'id, title, price, status'
                ).eq('creative_user_id', user_id).eq('is_active', True).in_('id', bundle_request.service_ids).execute()

                if not services_result.data or len(services_result.data) != len(bundle_request.service_ids):
                    raise HTTPException(status_code=422, detail="One or more services not found or don't belong to you")

                # Validate that all services are either Public or Bundle-Only
                for service in services_result.data:
                    if service['status'] not in ['Public', 'Bundle-Only']:
                        raise HTTPException(status_code=422, detail=f"Service '{service['title']}' cannot be included in bundles (must be Public or Bundle-Only)")

            # Update the bundle
            if update_data:
                update_data['updated_at'] = 'now()'
                result = client.table('creative_bundles').update(update_data).eq('id', bundle_id).execute()
                if not result.data:
                    raise HTTPException(status_code=500, detail="Failed to update bundle")

            # Update bundle-service relationships if service_ids are provided
            if bundle_request.service_ids is not None:
                # Delete existing bundle-service relationships
                client.table('bundle_services').delete().eq('bundle_id', bundle_id).execute()

                # Insert new bundle-service relationships
                bundle_services_data = [
                    {'bundle_id': bundle_id, 'service_id': service_id}
                    for service_id in bundle_request.service_ids
                ]

                bundle_services_result = client.table('bundle_services').insert(bundle_services_data).execute()

                if not bundle_services_result.data:
                    raise HTTPException(status_code=500, detail="Failed to update bundle services")

            return UpdateBundleResponse(success=True, message="Bundle updated successfully")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update bundle: {str(e)}")

    @staticmethod
    async def delete_bundle(user_id: str, bundle_id: str, client: Client = None) -> DeleteBundleResponse:
        """Soft delete a bundle by setting is_active to False"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Verify the bundle exists and belongs to the user
            bundle_result = client.table('creative_bundles').select(
                'id, creative_user_id, is_active, title'
            ).eq('id', bundle_id).single().execute()
            
            if not bundle_result.data:
                raise HTTPException(status_code=404, detail="Bundle not found")
            
            bundle_data = bundle_result.data
            
            if bundle_data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to delete this bundle")
            
            if not bundle_data['is_active']:
                raise HTTPException(status_code=400, detail="Bundle is already deleted")
            
            # Soft delete by setting is_active to False
            result = client.table('creative_bundles').update({
                'is_active': False,
                'updated_at': 'now()'
            }).eq('id', bundle_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to delete bundle")
            
            return DeleteBundleResponse(
                success=True,
                message=f"Bundle '{bundle_data['title']}' has been deleted successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete bundle: {str(e)}")

