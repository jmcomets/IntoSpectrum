import threading
import mpd
from flask_socketio import FlaskNamespace

class PlayerNamespace(FlaskNamespace):
    def __init__(self, *args, **kwargs):
        super(PlayerNamespace, self).__init__(*args, **kwargs)
        self.client = mpd.MPDClient()
        self.client.connect('localhost', '6060')
        self.client_lock = threading.Lock()

    def __getattr__(self, attr):
        actual_attr = super(PlayerNamespace, self).__getattr__(attr)
        if attr.startswith('on_') and callable(actual_attr):
            def inner(*args, **kwargs):
                with self._client_lock:
                    actual_attr(*args, **kwargs)
            return inner
        return actual_attr

    def on_next(self):
        with self.client_lock:
            self.client.next()

    def on_previous(self):
        with self.client_lock:
            self.client.previous()
