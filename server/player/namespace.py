import time
import threading
from functools import wraps
from socketio.namespace import BaseNamespace
from . import client
import settings

logger = settings.getLogger(__name__)

class Namespace(BaseNamespace):
    def __init__(self, *args, **kwargs):
        super(Namespace, self).__init__(*args, **kwargs)
        logger.info('initializing namespace')

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
        status = client.status()
        logger.info('status: %s', status)
        return status

    def _send_command(self, cmd):
        logger.info('sending command: %s', cmd)
        return getattr(client, cmd)()

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
            client.seek(time)

    def on_playlist_add(self, song_id, idx):
        pass

    def on_playlist_move(self, from_idx, to_idx):
        pass
