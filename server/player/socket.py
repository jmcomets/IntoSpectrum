import time
import threading
import logging
from socketio.namespace import BaseNamespace
from .client import Client

logger = logging.getLogger(__name__)
def _configure_logger():
    global logger
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)
_configure_logger()

class Namespace(BaseNamespace):
    def __init__(self, *args, **kwargs):
        super(Namespace, self).__init__(*args, **kwargs)
        logger.info('initializing namespace')
        self.client = Client()
        self.lock = threading.Lock()

    def __getattribute__(self, attr):
        """
        Make sure the lock is applied by wrapping any on_* methods.
        """
        actual_attr = super(Namespace, self).__getattribute__(attr)
        if attr.startswith('on_') and callable(actual_attr):
            logger.log('event: %s', attr.replace('on_', '', 1))
            def inner(*args, **kwargs):
                with self.lock:
                    retval = actual_attr(*args, **kwargs)
                return retval
            return inner
        return actual_attr

    def get_status(self):
        status = self.client.status()
        logger.info('status: %s', status)
        return status

    def on_info(self):
        self.emit('info', self.get_status())

    def on_time(self, time):
        try:
            time = float(time)
            if 100 < time < 0:
                raise ValueError
        except ValueError:
            pass
        else:
            self.client.seek(time)

    def on_playlist_add(self, song_id, idx):
        pass

    def on_playlist_move(self, from_idx, to_idx):
        pass

# generate similar (very simple) methods for Namespace class
for cmd in ('play', 'stop', 'toggle', 'next', 'previous'):
    def _cmd_fn(self):
        fn = getattr(self.client, cmd)
        if not callable(fn):
            raise ValueError('Generated function should be callable')
        return fn()
    setattr(Namespace, 'on_%s' % cmd, _cmd_fn)
