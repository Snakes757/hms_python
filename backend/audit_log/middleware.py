# audit_log/middleware.py
import threading
from django.utils.deprecation import MiddlewareMixin

# Thread-local storage for holding the current request.
# This allows access to the request object (and thus the user)
# in places where it's not directly available, like model signals.
_thread_locals = threading.local()

class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to store the current request in thread-local storage.
    This makes the request object accessible globally within the current thread,
    which is useful for audit logging purposes, especially in signal handlers
    where the request object isn't passed directly.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def __call__(self, request):
        """
        Processes the request. Stores the request in thread-local storage
        before handling the request and clears it after the response is generated.
        """
        _thread_locals.request = request
        response = self.get_response(request)
        # Clean up the thread-local storage after the request is processed.
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
        return response

def get_current_request():
    """
    Retrieves the current request object from thread-local storage.
    Returns None if no request is found (e.g., in a non-request context).
    """
    return getattr(_thread_locals, 'request', None)

def get_current_user():
    """
    Retrieves the currently authenticated user from the current request.
    Returns None if no request is found or if the user is not authenticated.
    """
    request = get_current_request()
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None
