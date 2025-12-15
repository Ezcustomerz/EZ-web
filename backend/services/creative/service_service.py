"""Service management for creative services"""
from fastapi import HTTPException, Request
from db.db_session import db_admin
from schemas.creative import (
    CreateServiceRequest, CreateServiceResponse, DeleteServiceResponse,
    UpdateServiceResponse, CreativeServiceResponse, CreativeServicesListResponse,
    PublicServicesAndBundlesResponse, CalendarSettingsRequest
)
from supabase import Client
from typing import Optional
import re
import json
from services.creative.photo_service import PhotoService
from services.creative.calendar_service import CalendarService


class ServiceService:
    """Service for handling creative service operations"""
    
    @staticmethod
    def _validate_delivery_time(delivery_time: str) -> dict:
        """Validate delivery time format and ensure min <= max"""
        if not delivery_time or not delivery_time.strip():
            return {'valid': True}  # Empty delivery time is valid (optional)
        
        # Match patterns like "3-5 days", "3 days", "1 week", "2-4 months"
        match = re.match(r'(\d+)(?:-(\d+))?\s*(day|week|month)s?', delivery_time.strip(), re.IGNORECASE)
        if not match:
            return {'valid': False, 'error': 'Invalid delivery time format. Expected format: "3-5 days" or "3 days"'}
        
        min_val = int(match.group(1))
        max_val = int(match.group(2)) if match.group(2) else min_val
        
        if min_val <= 0 or max_val <= 0:
            return {'valid': False, 'error': 'Delivery time values must be greater than 0'}
        
        if min_val > max_val:
            return {'valid': False, 'error': 'Minimum delivery time must be less than or equal to maximum delivery time'}
        
        return {'valid': True}
    
    @staticmethod
    async def create_service(user_id: str, service_request: CreateServiceRequest, request: Request = None, client: Client = None) -> CreateServiceResponse:
        """Create a new service for the creative"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Validate that the user has a creative profile
            creative_result = client.table('creatives').select('user_id').eq('user_id', user_id).single().execute()
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found. Please complete your creative setup first.")
            
            # Validate price is non-negative
            if service_request.price < 0:
                raise HTTPException(status_code=422, detail="Price cannot be negative")
            
            # Validate status
            if service_request.status not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")
            
            # Validate delivery_time if provided
            if service_request.delivery_time and service_request.delivery_time.strip():
                delivery_time_validation = ServiceService._validate_delivery_time(service_request.delivery_time)
                if not delivery_time_validation['valid']:
                    raise HTTPException(status_code=422, detail=delivery_time_validation['error'])
            
            # Validate split_deposit_amount if payment_option is 'split'
            split_deposit_amount = None
            if service_request.payment_option == 'split':
                if service_request.split_deposit_amount is not None:
                    if service_request.split_deposit_amount < 0:
                        raise HTTPException(status_code=422, detail="Split deposit amount cannot be negative")
                    if service_request.split_deposit_amount > service_request.price:
                        raise HTTPException(status_code=422, detail="Split deposit amount cannot exceed the total price")
                    split_deposit_amount = service_request.split_deposit_amount
                else:
                    # Default to 50% if not specified
                    split_deposit_amount = round(service_request.price * 0.5, 2)
            
            # Prepare service data
            service_data = {
                'creative_user_id': user_id,
                'title': service_request.title.strip(),
                'description': service_request.description.strip(),
                'price': service_request.price,
                'delivery_time': service_request.delivery_time,
                'status': service_request.status,
                'color': service_request.color,
                'payment_option': service_request.payment_option,
                'split_deposit_amount': split_deposit_amount,
                'is_active': True,
                'requires_booking': service_request.calendar_settings is not None
            }
            
            # Insert the service
            result = client.table('creative_services').insert(service_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create service")
            
            service_id = result.data[0]['id']
            
            # Handle calendar settings if provided
            if service_request.calendar_settings:
                await CalendarService.save_calendar_settings(service_id, service_request.calendar_settings, request)
            
            # Handle photos if provided
            if service_request.photos:
                await PhotoService.save_service_photos(service_id, service_request.photos)
            
            return CreateServiceResponse(
                success=True,
                message="Service created successfully",
                service_id=service_id
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")

    @staticmethod
    async def create_service_with_photos(user_id: str, request, client: Client = None) -> CreateServiceResponse:
        """Create a new service with photos in a single request"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Parse multipart form data
            form = await request.form()
            
            # Extract service data
            title = form.get('title', '').strip()
            description = form.get('description', '').strip()
            price = float(form.get('price', 0))
            delivery_time = form.get('delivery_time', '').strip()
            status = form.get('status', 'Private')
            color = form.get('color', '#3b82f6')
            payment_option = form.get('payment_option', 'later')
            
            # Extract calendar settings if provided
            calendar_settings = None
            calendar_settings_json = form.get('calendar_settings')
            if calendar_settings_json:
                try:
                    calendar_data = json.loads(calendar_settings_json)
                    calendar_settings = CalendarSettingsRequest(**calendar_data)
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Warning: Failed to parse calendar settings: {e}")
                    calendar_settings = None
            
            # Validate that the user has a creative profile
            creative_result = client.table('creatives').select('user_id').eq('user_id', user_id).single().execute()
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found. Please complete your creative setup first.")
            
            # Validate price is non-negative
            if price < 0:
                raise HTTPException(status_code=422, detail="Price cannot be negative")
            
            # Validate status
            if status not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")
            
            # Validate delivery_time if provided
            if delivery_time and delivery_time.strip():
                delivery_time_validation = ServiceService._validate_delivery_time(delivery_time)
                if not delivery_time_validation['valid']:
                    raise HTTPException(status_code=422, detail=delivery_time_validation['error'])
            
            # Validate split_deposit_amount if payment_option is 'split'
            split_deposit_amount = None
            split_deposit_str = form.get('split_deposit_amount')
            if payment_option == 'split':
                if split_deposit_str:
                    try:
                        split_deposit_amount = float(split_deposit_str)
                        if split_deposit_amount < 0:
                            raise HTTPException(status_code=422, detail="Split deposit amount cannot be negative")
                        if split_deposit_amount > price:
                            raise HTTPException(status_code=422, detail="Split deposit amount cannot exceed the total price")
                    except ValueError:
                        raise HTTPException(status_code=422, detail="Invalid split deposit amount")
                else:
                    # Default to 50% if not specified
                    split_deposit_amount = round(price * 0.5, 2)
            
            # Prepare service data
            service_data = {
                'creative_user_id': user_id,
                'title': title,
                'description': description,
                'price': price,
                'delivery_time': delivery_time,
                'status': status,
                'color': color,
                'payment_option': payment_option,
                'split_deposit_amount': split_deposit_amount,
                'is_active': True,
                'requires_booking': calendar_settings is not None,
            }
            
            # Insert the service
            result = client.table('creative_services').insert(service_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create service")
            
            service_id = result.data[0]['id']
            
            # Handle calendar settings if provided
            if calendar_settings:
                await CalendarService.save_calendar_settings(service_id, calendar_settings, request)
            
            # Handle photos if provided
            photos = form.getlist('photos')
            if photos:
                await PhotoService.save_service_photos_from_files(service_id, photos)
            
            return CreateServiceResponse(
                success=True,
                message="Service created successfully",
                service_id=service_id
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")

    @staticmethod
    async def update_service(user_id: str, service_id: str, service_request: CreateServiceRequest, request: Request = None, client: Client = None) -> UpdateServiceResponse:
        """Update an existing service"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Verify the service exists and belongs to the user
            service_result = client.table('creative_services').select(
                'id, creative_user_id, is_active'
            ).eq('id', service_id).single().execute()

            if not service_result.data:
                raise HTTPException(status_code=404, detail="Service not found")

            if service_result.data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to edit this service")

            if not service_result.data['is_active']:
                raise HTTPException(status_code=400, detail="Cannot edit a deleted service")

            if service_request.price < 0:
                raise HTTPException(status_code=422, detail="Price cannot be negative")

            if service_request.status not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")

            # Validate delivery_time if provided
            if service_request.delivery_time and service_request.delivery_time.strip():
                delivery_time_validation = ServiceService._validate_delivery_time(service_request.delivery_time)
                if not delivery_time_validation['valid']:
                    raise HTTPException(status_code=422, detail=delivery_time_validation['error'])

            # Validate split_deposit_amount if payment_option is 'split'
            split_deposit_amount = None
            if service_request.payment_option == 'split':
                if service_request.split_deposit_amount is not None:
                    if service_request.split_deposit_amount < 0:
                        raise HTTPException(status_code=422, detail="Split deposit amount cannot be negative")
                    if service_request.split_deposit_amount > service_request.price:
                        raise HTTPException(status_code=422, detail="Split deposit amount cannot exceed the total price")
                    split_deposit_amount = service_request.split_deposit_amount
                else:
                    # Default to 50% if not specified
                    split_deposit_amount = round(service_request.price * 0.5, 2)

            update_data = {
                'title': service_request.title.strip(),
                'description': service_request.description.strip(),
                'price': service_request.price,
                'delivery_time': service_request.delivery_time,
                'status': service_request.status,
                'color': service_request.color,
                'payment_option': service_request.payment_option,
                'split_deposit_amount': split_deposit_amount,
                'updated_at': 'now()',
                'requires_booking': service_request.calendar_settings is not None,
            }

            # Update the service
            result = client.table('creative_services').update(update_data).eq('id', service_id).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to update service")

            # Handle calendar settings if provided
            if service_request.calendar_settings:
                await CalendarService.save_calendar_settings(service_id, service_request.calendar_settings, request)
            
            # Handle photos if provided
            if service_request.photos:
                await PhotoService.save_service_photos(service_id, service_request.photos)

            return UpdateServiceResponse(success=True, message="Service updated successfully")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update service: {str(e)}")

    @staticmethod
    async def update_service_with_photos(
        user_id: str, 
        service_id: str, 
        service_data: dict, 
        photo_files, 
        calendar_settings=None, 
        request: Request = None, 
        client: Client = None, 
        existing_photos_to_keep: list = None
    ) -> UpdateServiceResponse:
        """Update an existing service with new photos, keeping selected existing photos"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        if existing_photos_to_keep is None:
            existing_photos_to_keep = []
        
        try:
            # Verify the service exists and belongs to the user
            service_result = client.table('creative_services').select(
                'id, creative_user_id, is_active'
            ).eq('id', service_id).single().execute()

            if not service_result.data:
                raise HTTPException(status_code=404, detail="Service not found")

            if service_result.data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to edit this service")

            if not service_result.data['is_active']:
                raise HTTPException(status_code=400, detail="Cannot edit a deleted service")

            if service_data['price'] < 0:
                raise HTTPException(status_code=422, detail="Price cannot be negative")

            if service_data['status'] not in ['Public', 'Private', 'Bundle-Only']:
                raise HTTPException(status_code=422, detail="Status must be either 'Public', 'Private', or 'Bundle-Only'")

            # Validate delivery_time if provided
            if service_data.get('delivery_time') and service_data['delivery_time'].strip():
                delivery_time_validation = ServiceService._validate_delivery_time(service_data['delivery_time'])
                if not delivery_time_validation['valid']:
                    raise HTTPException(status_code=422, detail=delivery_time_validation['error'])

            # Validate split_deposit_amount if payment_option is 'split'
            split_deposit_amount = None
            payment_option = service_data.get('payment_option', 'later')
            if payment_option == 'split':
                if service_data.get('split_deposit_amount') is not None:
                    if service_data['split_deposit_amount'] < 0:
                        raise HTTPException(status_code=422, detail="Split deposit amount cannot be negative")
                    if service_data['split_deposit_amount'] > service_data['price']:
                        raise HTTPException(status_code=422, detail="Split deposit amount cannot exceed the total price")
                    split_deposit_amount = service_data['split_deposit_amount']
                else:
                    # Default to 50% if not specified
                    split_deposit_amount = round(service_data['price'] * 0.5, 2)

            # Update service data
            update_data = {
                'title': service_data['title'].strip(),
                'description': service_data['description'].strip(),
                'price': service_data['price'],
                'delivery_time': service_data.get('delivery_time', ''),
                'status': service_data['status'],
                'color': service_data['color'],
                'payment_option': payment_option,
                'split_deposit_amount': split_deposit_amount,
                'updated_at': 'now()',
                'requires_booking': calendar_settings is not None,
            }

            result = client.table('creative_services').update(update_data).eq('id', service_id).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to update service")

            # Handle calendar settings if provided
            if calendar_settings:
                await CalendarService.save_calendar_settings(service_id, calendar_settings, request)
            
            # Handle photos: Delete photos not in the keep list, keep existing ones, add new ones
            await PhotoService.update_service_photos_selective(service_id, existing_photos_to_keep, photo_files)

            return UpdateServiceResponse(success=True, message="Service updated successfully")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update service: {str(e)}")

    @staticmethod
    async def delete_service(user_id: str, service_id: str, client: Client = None) -> DeleteServiceResponse:
        """Soft delete a service by setting is_active to False"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Verify the service exists and belongs to the user
            service_result = client.table('creative_services').select(
                'id, creative_user_id, is_active, title'
            ).eq('id', service_id).single().execute()
            
            if not service_result.data:
                raise HTTPException(status_code=404, detail="Service not found")
            
            service_data = service_result.data
            
            if service_data['creative_user_id'] != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to delete this service")
            
            if not service_data['is_active']:
                raise HTTPException(status_code=400, detail="Service is already deleted")
            
            # Soft delete by setting is_active to False
            result = client.table('creative_services').update({
                'is_active': False,
                'updated_at': 'now()'
            }).eq('id', service_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to delete service")
            
            # Also deactivate calendar settings for this service
            client.table('calendar_settings').update({
                'is_active': False,
                'updated_at': 'now()'
            }).eq('service_id', service_id).execute()
            
            # Delete associated photos from storage and database
            await PhotoService.delete_service_photos(service_id)
            
            return DeleteServiceResponse(
                success=True,
                message=f"Service '{service_data['title']}' has been deleted successfully"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete service: {str(e)}")

    @staticmethod
    async def get_creative_services_and_bundles(user_id: str, client: Client, public_only: bool = False) -> PublicServicesAndBundlesResponse:
        """Get all services and bundles associated with the creative"""
        if not client:
            raise ValueError("Supabase client is required for this operation")
        
        try:
            # Build services query
            services_query = client.table('creative_services').select(
                'id, title, description, price, delivery_time, status, color, payment_option, split_deposit_amount, is_active, created_at, updated_at, requires_booking'
            ).eq('creative_user_id', user_id).eq('is_active', True)
            
            # Filter for public only if requested
            if public_only:
                services_query = services_query.eq('status', 'Public')
            
            services_result = services_query.order('created_at', desc=True).execute()
            
            services = []
            if services_result.data:
                # Get service IDs for photo lookup
                service_ids = [service['id'] for service in services_result.data]
                
                # Get photos for all services
                photos_result = client.table('service_photos').select(
                    'service_id, photo_url, photo_filename, photo_size_bytes, is_primary, display_order'
                ).in_('service_id', service_ids).order('service_id').order('display_order', desc=False).execute()
                
                # Group photos by service_id
                photos_by_service = {}
                if photos_result.data:
                    for photo in photos_result.data:
                        service_id = photo['service_id']
                        if service_id not in photos_by_service:
                            photos_by_service[service_id] = []
                        photos_by_service[service_id].append({
                            'photo_url': photo['photo_url'],
                            'photo_filename': photo['photo_filename'],
                            'photo_size_bytes': photo['photo_size_bytes'],
                            'is_primary': photo['is_primary'],
                            'display_order': photo['display_order']
                        })
                
                for service_data in services_result.data:
                    service = CreativeServiceResponse(
                        id=service_data['id'],
                        title=service_data['title'],
                        description=service_data['description'],
                        price=float(service_data['price']),
                        delivery_time=service_data['delivery_time'],
                        status=service_data['status'],
                        color=service_data['color'],
                        payment_option=service_data['payment_option'],
                        split_deposit_amount=float(service_data['split_deposit_amount']) if service_data.get('split_deposit_amount') is not None else None,
                        is_active=service_data['is_active'],
                        created_at=service_data['created_at'],
                        updated_at=service_data['updated_at'],
                        requires_booking=service_data['requires_booking'],
                        photos=photos_by_service.get(service_data['id'], [])
                    )
                    services.append(service)
            
            # Build bundles query
            bundles_query = client.table('creative_bundles').select(
                'id, title, description, color, status, pricing_option, fixed_price, discount_percentage, is_active, created_at, updated_at'
            ).eq('creative_user_id', user_id).eq('is_active', True)
            
            # Filter for public only if requested
            if public_only:
                bundles_query = bundles_query.eq('status', 'Public')
            
            bundles_result = bundles_query.order('created_at', desc=True).execute()
            
            bundles = []
            if bundles_result.data:
                for bundle_data in bundles_result.data:
                    # Get services for this bundle
                    bundle_services_result = client.table('bundle_services').select(
                        'service_id'
                    ).eq('bundle_id', bundle_data['id']).execute()
                    
                    service_ids = [bs['service_id'] for bs in bundle_services_result.data] if bundle_services_result.data else []
                    
                    # Get service details
                    services_result = client.table('creative_services').select(
                        'id, title, description, price, delivery_time, status, color'
                    ).in_('id', service_ids).execute()
                    
                    # Fetch photos for bundle services
                    bundle_photos_result = client.table('service_photos').select(
                        'service_id, photo_url, photo_filename, photo_size_bytes, is_primary, display_order'
                    ).in_('service_id', service_ids).order('service_id').order('display_order', desc=False).execute()
                    
                    # Group photos by service_id
                    bundle_photos_by_service = {}
                    if bundle_photos_result.data:
                        for photo in bundle_photos_result.data:
                            service_id = photo['service_id']
                            if service_id not in bundle_photos_by_service:
                                bundle_photos_by_service[service_id] = []
                            bundle_photos_by_service[service_id].append({
                                'photo_url': photo['photo_url'],
                                'photo_filename': photo['photo_filename'],
                                'photo_size_bytes': photo['photo_size_bytes'],
                                'is_primary': photo['is_primary'],
                                'display_order': photo['display_order']
                            })
                    
                    from schemas.creative import BundleServiceResponse, CreativeBundleResponse
                    bundle_services = []
                    total_services_price = 0
                    for service_data in services_result.data:
                        service_photos = bundle_photos_by_service.get(service_data['id'], [])
                        service = BundleServiceResponse(
                            id=service_data['id'],
                            title=service_data['title'],
                            description=service_data['description'],
                            price=float(service_data['price']),
                            delivery_time=service_data['delivery_time'],
                            status=service_data['status'],
                            color=service_data['color'],
                            photos=service_photos
                        )
                        bundle_services.append(service)
                        total_services_price += service.price
                    
                    # Calculate final price
                    if bundle_data['pricing_option'] == 'fixed':
                        final_price = float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else total_services_price
                    else:  # discount
                        discount_percentage = float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else 0
                        discount_amount = total_services_price * (discount_percentage / 100)
                        final_price = total_services_price - discount_amount
                    
                    bundle = CreativeBundleResponse(
                        id=bundle_data['id'],
                        title=bundle_data['title'],
                        description=bundle_data['description'],
                        color=bundle_data['color'],
                        status=bundle_data['status'],
                        pricing_option=bundle_data['pricing_option'],
                        fixed_price=float(bundle_data['fixed_price']) if bundle_data['fixed_price'] else None,
                        discount_percentage=float(bundle_data['discount_percentage']) if bundle_data['discount_percentage'] else None,
                        total_services_price=total_services_price,
                        final_price=final_price,
                        services=bundle_services,
                        is_active=bundle_data['is_active'],
                        created_at=bundle_data['created_at'],
                        updated_at=bundle_data['updated_at']
                    )
                    bundles.append(bundle)
            
            return PublicServicesAndBundlesResponse(
                services=services,
                bundles=bundles,
                services_count=len(services),
                bundles_count=len(bundles)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch creative services and bundles: {str(e)}")

