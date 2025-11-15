import re
from typing import Tuple

# Maximum input lengths to prevent ReDoS attacks
MAX_EMAIL_LENGTH = 254  # RFC 5321 limit
MAX_PHONE_LENGTH = 20   # E.164 maximum length
MAX_CONTACT_FIELD_LENGTH = 320  # Email + phone buffer

def validate_email(email: str) -> bool:
    """Validate email format with ReDoS protection"""
    if not email:
        return False
    
    # Prevent ReDoS by limiting input length
    if len(email) > MAX_EMAIL_LENGTH:
        return False
    
    # Email pattern - anchored to prevent backtracking issues
    # The length limit above prevents ReDoS attacks even if the pattern has some ambiguity
    # Pattern follows RFC 5321 guidelines (simplified for practical use)
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    try:
        return re.match(email_pattern, email) is not None
    except re.error:
        # If regex fails for any reason, reject the input
        return False

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format with ReDoS protection"""
    if not phone:
        return False
    
    # Prevent ReDoS by limiting input length before processing
    if len(phone) > MAX_PHONE_LENGTH * 3:  # Allow for formatting characters
        return False
    
    # Remove all non-digit characters except + for international prefix
    # This regex is safe as it's a simple character class replacement
    try:
        cleaned_phone = re.sub(r'[^\d+]', '', phone)
    except re.error:
        return False
    
    # Additional length check after cleaning
    if len(cleaned_phone) > MAX_PHONE_LENGTH:
        return False
    
    # Basic phone number patterns - all well-anchored to prevent backtracking
    # Supports formats like: +1234567890, 1234567890, (123) 456-7890, 123-456-7890, etc.
    phone_patterns = [
        r'^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$',  # US/Canada format
        r'^\+?[1-9]\d{1,14}$',  # International format (E.164) - max 15 digits with +
        r'^\d{10}$',  # 10-digit US format
        r'^\d{11}$',  # 11-digit with country code
    ]
    
    try:
        return any(re.match(pattern, cleaned_phone) for pattern in phone_patterns)
    except re.error:
        return False

def validate_contact_field(contact: str) -> Tuple[bool, str]:
    """
    Validate a contact field as either email or phone number with ReDoS protection
    Returns (is_valid, field_type) where field_type is 'email', 'phone', or 'invalid'
    """
    if not contact:
        return False, 'empty'
    
    # Prevent ReDoS by limiting input length before any processing
    if len(contact) > MAX_CONTACT_FIELD_LENGTH:
        return False, 'too_long'
    
    contact = contact.strip()
    
    if not contact:
        return False, 'empty'
    
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
