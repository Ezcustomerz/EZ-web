import re
from typing import Tuple

def validate_email(email: str) -> bool:
    """Validate email format"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format - supports various international formats"""
    # Remove all non-digit characters except + for international prefix
    cleaned_phone = re.sub(r'[^\d+]', '', phone)
    
    # Basic phone number patterns
    # Supports formats like: +1234567890, 1234567890, (123) 456-7890, 123-456-7890, etc.
    phone_patterns = [
        r'^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$',  # US/Canada format
        r'^\+?[1-9]\d{1,14}$',  # International format (E.164)
        r'^\d{10}$',  # 10-digit US format
        r'^\d{11}$',  # 11-digit with country code
    ]
    
    return any(re.match(pattern, cleaned_phone) for pattern in phone_patterns)

def validate_contact_field(contact: str) -> Tuple[bool, str]:
    """
    Validate a contact field as either email or phone number
    Returns (is_valid, field_type) where field_type is 'email', 'phone', or 'invalid'
    """
    if not contact or not contact.strip():
        return False, 'empty'
    
    contact = contact.strip()
    
    # Check if it looks like an email (contains @)
    if '@' in contact:
        if validate_email(contact):
            return True, 'email'
        else:
            return False, 'invalid_email'
    
    # Check if it looks like a phone number
    elif validate_phone_number(contact):
        return True, 'phone'
    
    return False, 'invalid_format'

def validate_roles(selected_roles: list[str]) -> Tuple[bool, str]:
    """
    Validate user roles
    Returns (is_valid, error_message)
    """
    valid_roles = ['client', 'creative', 'advocate']
    
    if not selected_roles or len(selected_roles) == 0:
        return False, "Must select at least one role"
    
    if len(selected_roles) > 3:
        return False, "Cannot select more than 3 roles"
    
    for role in selected_roles:
        if role not in valid_roles:
            return False, f"Invalid role '{role}'. Valid roles are: {', '.join(valid_roles)}"
    
    return True, ""
