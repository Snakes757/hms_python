# audit_log/utils.py

def get_client_ip(request):
    """
    Retrieves the client's IP address from the request object.
    It checks for 'HTTP_X_FORWARDED_FOR' header first (commonly used by proxies)
    and falls back to 'REMOTE_ADDR'.

    Args:
        request: The HttpRequest object.

    Returns:
        str: The client's IP address, or None if not determinable.
    """
    if not request:
        return None

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # The first IP in the list is the original client IP.
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        # Fallback to REMOTE_ADDR if X-Forwarded-For is not present.
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_user_agent(request):
    """
    Retrieves the client's User-Agent string from the request object.

    Args:
        request: The HttpRequest object.

    Returns:
        str: The User-Agent string, or an empty string if not available.
    """
    if not request:
        return '' # Return empty string for consistency if request is None
    return request.META.get('HTTP_USER_AGENT', '') # Default to empty string
