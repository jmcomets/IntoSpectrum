import threading
from functools import wraps
import mpd
import settings

_global_client = mpd.MPDClient()
_global_client.connect(settings.MPD_HOST, settings.MPD_PORT)
_global_lock = threading.Lock()

class Client(object):
    """
    Wrapper for mpd.MPDClient, see that class for full documentation.
    """
    def __getattr__(self, attr):
        actual_attr = getattr(_global_client, attr)
        if callable(actual_attr):
            @wraps(actual_attr)
            def inner(*args, **kwargs):
                with _global_lock:
                    retval = actual_attr(*args, **kwargs)
                return retval
            return inner
        return actual_attr
