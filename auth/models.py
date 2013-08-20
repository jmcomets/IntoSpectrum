from django.db import models
from django.contrib.auth import models as auth_models

__all__ = ('User')

User = auth_models.User
