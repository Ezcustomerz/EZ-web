"""Photo management service for creative services and profiles"""
from fastapi import HTTPException, UploadFile
from db.db_session import db_admin
from supabase import Client
from typing import List
import re
import uuid
import asyncio
import os


class PhotoService:
    """Service for handling photo uploads and deletions"""
    
    @staticmethod
    async def delete_service_photos(service_id: str):
        """Delete all photos associated with a service from storage and database"""
        try:
            # Get all photos for this service BEFORE deleting from database
            photos_result = db_admin.table('service_photos').select(
                'photo_url, photo_filename'
            ).eq('service_id', service_id).execute()
            
            print(f"Found {len(photos_result.data) if photos_result.data else 0} photos to delete for service {service_id}")
            
            if photos_result.data:
                # Extract file paths from URLs and delete from storage
                files_to_delete = []
                
                for photo in photos_result.data:
                    photo_url = photo['photo_url']
                    print(f"Processing photo URL: {photo_url}")
                    if photo_url:
                        # Extract the file path from the URL
                        match = re.search(r'/storage/v1/object/public/creative-assets/(.+)', photo_url)
                        if match:
                            file_path = match.group(1)
                            file_path = file_path.split('?')[0]  # Remove query params
                            print(f"Extracted file path: {file_path}")
                            files_to_delete.append(file_path)
                        else:
                            # Try alternative URL patterns
                            alt_match = re.search(r'/storage/v1/object/public/([^/]+)/(.+)', photo_url)
                            if alt_match:
                                bucket_name = alt_match.group(1)
                                file_path = alt_match.group(2)
                                print(f"Alternative pattern - bucket: {bucket_name}, file path: {file_path}")
                                files_to_delete.append(file_path)
                
                # Delete all files at once if we have any
                if files_to_delete:
                    print(f"Attempting to delete {len(files_to_delete)} files from storage: {files_to_delete}")
                    try:
                        result = db_admin.storage.from_("creative-assets").remove(files_to_delete)
                        print(f"Storage deletion result: {result}")
                    except Exception as e:
                        print(f"Failed to delete photos from storage: {files_to_delete}, error: {str(e)}")
                
                # Delete photo records from database AFTER storage cleanup
                print(f"Deleting photo records from database for service {service_id}")
                db_admin.table('service_photos').delete().eq('service_id', service_id).execute()
                print(f"Successfully deleted photo records from database")
            
        except Exception as e:
            print(f"Failed to delete service photos for service {service_id}: {str(e)}")
            # Don't raise exception here as service deletion should still succeed even if photo cleanup fails

    @staticmethod
    async def save_service_photos(service_id: str, photos):
        """Save service photos for a service"""
        try:
            # First, delete existing photos from both storage and database
            await PhotoService.delete_service_photos(service_id)
            
            # Insert new photos
            if photos:
                photos_data = []
                for i, photo in enumerate(photos):
                    photos_data.append({
                        'service_id': service_id,
                        'photo_url': photo.photo_url,
                        'photo_filename': photo.photo_filename,
                        'photo_size_bytes': photo.photo_size_bytes,
                        'is_primary': photo.is_primary,
                        'display_order': photo.display_order if photo.display_order > 0 else i
                    })
                
                if photos_data:
                    db_admin.table('service_photos').insert(photos_data).execute()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save service photos: {str(e)}")

    @staticmethod
    async def save_service_photos_from_files(service_id: str, photo_files):
        """Save service photos from uploaded files with parallel processing"""
        try:
            # First, delete existing photos from both storage and database
            await PhotoService.delete_service_photos(service_id)
            
            # Upload photos to Supabase Storage and save metadata
            if photo_files:
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                
                if not supabase_url or not supabase_key:
                    raise HTTPException(status_code=500, detail="Storage configuration missing")
                
                from supabase import create_client, Client
                supabase: Client = create_client(supabase_url, supabase_key)
                
                async def upload_single_photo(photo_file, index):
                    """Upload a single photo and return metadata"""
                    if not photo_file or not hasattr(photo_file, 'filename') or not photo_file.filename:
                        return None
                    
                    try:
                        # Read file content
                        file_content = await photo_file.read()
                        file_extension = photo_file.filename.split('.')[-1] if '.' in photo_file.filename else 'jpg'
                        filename = f"service-photos/{service_id}/{index}_{photo_file.filename}"
                        
                        # Upload file to storage
                        result = supabase.storage.from_("creative-assets").upload(
                            filename, 
                            file_content,
                            file_options={
                                "content-type": photo_file.content_type or "image/jpeg",
                                "cache-control": "3600"
                            }
                        )
                        
                        if result:
                            # Get public URL
                            public_url = supabase.storage.from_("creative-assets").get_public_url(filename)
                            
                            return {
                                'service_id': service_id,
                                'photo_url': public_url,
                                'photo_filename': photo_file.filename,
                                'photo_size_bytes': len(file_content),
                                'is_primary': index == 0,  # First photo is primary
                                'display_order': index
                            }
                    except Exception as e:
                        print(f"Failed to upload photo {index}: {str(e)}")
                        return None
                
                # Upload all photos in parallel with error handling
                upload_tasks = [
                    upload_single_photo(photo_file, i) 
                    for i, photo_file in enumerate(photo_files)
                ]
                
                # Wait for all uploads to complete
                photos_data = await asyncio.gather(*upload_tasks, return_exceptions=True)
                
                # Filter out exceptions and None results
                photos_data = [
                    photo for photo in photos_data 
                    if photo is not None and not isinstance(photo, Exception)
                ]
                
                # Batch insert all photo metadata
                if photos_data:
                    db_admin.table('service_photos').insert(photos_data).execute()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save service photos: {str(e)}")

    @staticmethod
    async def update_service_photos_selective(
        service_id: str, 
        existing_photos_to_keep: List[str], 
        new_photo_files
    ):
        """Selectively update service photos - keep some existing, delete others, add new ones
        
        Args:
            service_id: The service ID
            existing_photos_to_keep: List of photo URLs to keep
            new_photo_files: List of new photo files to upload
        """
        try:
            # Get all current photos for this service
            current_photos_result = db_admin.table('service_photos').select(
                'id, photo_url, photo_filename, photo_size_bytes, is_primary, display_order'
            ).eq('service_id', service_id).order('display_order', desc=False).execute()
            
            current_photos = current_photos_result.data or []
            
            # Normalize URLs for comparison (remove query parameters and trailing slashes)
            def normalize_url(url):
                if not url:
                    return ""
                url = url.split('?')[0]
                url = url.rstrip('/')
                return url
            
            # Create a set of normalized URLs to keep
            normalized_keep_urls = {normalize_url(url) for url in existing_photos_to_keep}
            
            # Identify photos to keep and photos to delete
            photos_to_keep = []
            photos_to_delete = []
            
            for photo in current_photos:
                normalized_photo_url = normalize_url(photo['photo_url'])
                
                if normalized_photo_url in normalized_keep_urls:
                    photos_to_keep.append(photo)
                else:
                    photos_to_delete.append(photo)
            
            # Delete photos that are not in the keep list
            if photos_to_delete:
                # Extract file paths and delete from storage
                files_to_delete = []
                photo_ids_to_delete = []
                
                for photo in photos_to_delete:
                    photo_ids_to_delete.append(photo['id'])
                    photo_url = photo['photo_url']
                    
                    if photo_url:
                        # Extract the file path from the URL
                        match = re.search(r'/storage/v1/object/public/creative-assets/(.+)', photo_url)
                        if match:
                            file_path = match.group(1).split('?')[0]  # Remove query params
                            files_to_delete.append(file_path)
                
                # Delete files from storage
                if files_to_delete:
                    try:
                        db_admin.storage.from_("creative-assets").remove(files_to_delete)
                    except Exception as e:
                        print(f"Failed to delete photos from storage: {str(e)}")
                
                # Delete photo records from database
                if photo_ids_to_delete:
                    db_admin.table('service_photos').delete().in_('id', photo_ids_to_delete).execute()
            
            # Upload new photos and get their metadata
            new_photos_metadata = []
            if new_photo_files:
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                
                if not supabase_url or not supabase_key:
                    raise HTTPException(status_code=500, detail="Storage configuration missing")
                
                from supabase import create_client, Client
                supabase: Client = create_client(supabase_url, supabase_key)
                
                async def upload_single_photo(photo_file, index):
                    """Upload a single photo and return metadata"""
                    if not photo_file or not hasattr(photo_file, 'filename') or not photo_file.filename:
                        return None
                    
                    try:
                        # Read file content
                        file_content = await photo_file.read()
                        file_extension = photo_file.filename.split('.')[-1] if '.' in photo_file.filename else 'jpg'
                        filename = f"service-photos/{service_id}/{index}_{photo_file.filename}"
                        
                        # Upload file to storage
                        result = supabase.storage.from_("creative-assets").upload(
                            filename, 
                            file_content,
                            file_options={
                                "content-type": photo_file.content_type or "image/jpeg",
                                "cache-control": "3600"
                            }
                        )
                        
                        if result:
                            # Get public URL
                            public_url = supabase.storage.from_("creative-assets").get_public_url(filename)
                            
                            return {
                                'photo_url': public_url,
                                'photo_filename': photo_file.filename,
                                'photo_size_bytes': len(file_content),
                            }
                    except Exception as e:
                        print(f"Failed to upload photo {index}: {str(e)}")
                        return None
                
                # Upload all new photos in parallel
                upload_tasks = [
                    upload_single_photo(photo_file, len(current_photos) + i) 
                    for i, photo_file in enumerate(new_photo_files)
                ]
                
                results = await asyncio.gather(*upload_tasks, return_exceptions=True)
                
                # Filter out None and exceptions
                new_photos_metadata = [
                    photo for photo in results 
                    if photo is not None and not isinstance(photo, Exception)
                ]
            
            # Calculate new display order for all photos (kept + new)
            all_photos = []
            
            # Add kept photos with updated display order
            for i, photo in enumerate(photos_to_keep):
                all_photos.append({
                    'id': photo['id'],
                    'display_order': i,
                    'is_primary': i == 0  # First photo is primary
                })
            
            # Prepare new photos for insertion
            new_photos_to_insert = []
            for i, photo_meta in enumerate(new_photos_metadata):
                display_order = len(photos_to_keep) + i
                new_photos_to_insert.append({
                    'service_id': service_id,
                    'photo_url': photo_meta['photo_url'],
                    'photo_filename': photo_meta['photo_filename'],
                    'photo_size_bytes': photo_meta['photo_size_bytes'],
                    'is_primary': display_order == 0,  # First photo is primary
                    'display_order': display_order
                })
            
            # Update display order and is_primary for kept photos
            if all_photos:
                for photo_update in all_photos:
                    db_admin.table('service_photos').update({
                        'display_order': photo_update['display_order'],
                        'is_primary': photo_update['is_primary']
                    }).eq('id', photo_update['id']).execute()
            
            # Insert new photos
            if new_photos_to_insert:
                db_admin.table('service_photos').insert(new_photos_to_insert).execute()
            
        except Exception as e:
            print(f"Failed to update service photos: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update service photos: {str(e)}")

