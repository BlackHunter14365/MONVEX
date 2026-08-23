"""
ASGI config for MONVEX project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monvex.settings')
application = get_asgi_application()
