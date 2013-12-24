import time
import threading
from socketio.namespace import BaseNamespace
from .client import Client

class Namespace(BaseNamespace):
    UPDATE_INTERVAL = 5
    PROTOCOL = {
            'status': 'info',
            }

    def __init__(self, *args, **kwargs):
        super(Namespace, self).__init__(*args, **kwargs)
        self.client = Client()
        self.lock = threading.Lock()
        self.status_thread = threading.Thread(target=self._send_status)
        self.status_thread.daemon = True
        self.status_thread.start()

    def _send_status(self):
        """
        Status sending thread, emitting regularly mpd's status to all clients
        (interval: UPDATE_INTERVAL).
        """
        while True:
            with self.lock:
                self.emit('status', self.client.status())
            time.sleep(self.UPDATE_INTERVAL)

    def __getattribute__(self, attr):
        """
        Make sure the lock is applied by wrapping any on_* methods.
        """
        actual_attr = super(Namespace, self).__getattribute__(attr)
        if attr.startswith('on_') and callable(actual_attr):
            def inner(*args, **kwargs):
                with self.lock:
                    retval = actual_attr(*args, **kwargs)
                return retval
            return inner
        return actual_attr

    def emit(self, event, *args, **kwargs):
        """
        Overriden 'emit' method, applying the conversion from our protocol to
        the client's protocol, allowing more flexibility between our naming
        conventions and the client's conventions.
        """
        assert event in self.PROTOCOL, 'Unknown event "%s"' % event
        return super(Namespace, self).emit(self.PROTOCOL[event], *args, **kwargs)

    def on_info(self):
        self.emit('status', self.client.status())
