import sys
import socket
import threading
from functools import wraps
import mpd
import settings

logger = settings.getLogger(__name__)

_client = mpd.MPDClient()
_lock = threading.Lock()
_connected = False

def connect(host, port):
    global _connected
    assert not _connected, 'MPD client cannot connect, already connected'
    try:
        _client.connect(host, port)
    except socket.error as e:
        logger.error('connection failed: %s', str(e))
    else:
        logger.info('mpd connected at http://%s:%s', host, port)
        _connected = True

class _Client(object):
    def __getattr__(self, attr):
        assert _connected, 'MPD client not connected, use connect_to_mpd(host, port)'
        actual_attr = getattr(_client, attr)
        if callable(actual_attr):
            @wraps(actual_attr)
            def inner(*args, **kwargs):
                with _lock:
                    retval = actual_attr(*args, **kwargs)
                return retval
            return inner
        return actual_attr

def get_client():
    return _Client()
