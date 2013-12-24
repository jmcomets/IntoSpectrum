import time
import threading
from socketio.namespace import BaseNamespace
from .client import Client

class Namespace(BaseNamespace):
    def __init__(self, *args, **kwargs):
        super(Namespace, self).__init__(*args, **kwargs)
        self.client = Client()
        self.lock = threading.Lock()

    def __getattribute__(self, attr):
        """
        Make sure the lock is applied by wrapping any on_* methods.
        """
        actual_attr = super(Namespace, self).__getattribute__(attr)
        if attr.startswith('on_') and callable(actual_attr):
            print 'event:', attr.replace('on_', '', 1)
            def inner(*args, **kwargs):
                with self.lock:
                    retval = actual_attr(*args, **kwargs)
                return retval
            return inner
        return actual_attr

    def on_info(self):
        self.emit('info', self.client.status())
