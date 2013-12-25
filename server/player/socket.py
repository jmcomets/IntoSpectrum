import time
import threading
import logging
from functools import wraps
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
            event = attr.replace('on_', '', 1)
            @wraps(actual_attr)
            def inner(*args, **kwargs):
                with self.lock:
                    retval = actual_attr(*args, **kwargs)
                return retval
            logger.info('event: %s', event)
            return inner
        return actual_attr

    def get_status(self):
        status = self.client.status()
        logger.info('status: %s', status)
        return status

    def _send_command(self, cmd):
        logger.info('sending command: %s', cmd)
        return getattr(self.client, cmd)()

    # TODO set this up at runtime
    on_play = lambda self: self._send_command('play')
    on_stop = lambda self: self._send_command('stop')
    on_next = lambda self: self._send_command('next')
    on_previous = lambda self: self._send_command('previous')
    on_toggle = lambda self: self._send_command('toggle')

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
