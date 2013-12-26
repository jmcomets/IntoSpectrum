import time
import threading
from functools import wraps
from socketio.namespace import BaseNamespace
from socketio.mixins import BroadcastMixin
from .client import get_client
from . import database
import settings

logger = settings.getLogger(__name__)

class ScheduleMixin(object):
    """
    Gevent-socketio namespace mixin, adding a simple scheduling mechanism.

    Example usage:
    >>> class MyNamespace(BaseNamespace, ScheduleMixin):
    >>>     def __init__(self, *args, **kwargs):
    >>>         super(MyNamespace, self).__init__(*args, **kwargs)
    >>>         self.schedule_every(self.foo, 5) # update every 5 seconds
    """
    def schedule_every(self, target, timeout, target_id=None, args=[], kwargs={}):
        if target_id is None:
            target_id = id(target)
        if target_id in self.scheduled:
            return
        self.scheduled.add(target_id)
        def inner():
            while True:
                target(*args, **kwargs)
                time.sleep(timeout)
        thread = threading.Thread(target=inner)
        thread.daemon = True
        thread.start()

    @property
    def scheduled(self):
        if not hasattr(self.socket.server, 'scheduled'):
            self.socket.server.scheduled = set()
        return self.socket.server.scheduled

class Namespace(BaseNamespace, BroadcastMixin, ScheduleMixin):
    UPDATE_INTERVAL = 5

    def __init__(self, *args, **kwargs):
        super(Namespace, self).__init__(*args, **kwargs)
        logger.info('initializing namespace')
        self.client = get_client()
        self.schedule_every(self.send_info, self.UPDATE_INTERVAL, target_id=__name__)

    def __getattribute__(self, attr):
        """
        Make sure the lock is applied by wrapping any on_* methods.
        """
        actual_attr = super(Namespace, self).__getattribute__(attr)
        if attr.startswith('on_') and callable(actual_attr):
            event = attr.replace('on_', '', 1)
            logger.info('event: %s', event)
            if event != 'info':
                @wraps(actual_attr)
                def inner(*args, **kwargs):
                    try:
                        retval = actual_attr(*args, **kwargs)
                        self.send_response()
                        return retval
                    except TypeError as e:
                        logger.exception(e)
                return inner
        return actual_attr

    def update(self):
        status = get_status()
        logger.info('status: %s', status)
        self.send_status('info', status)

    def get_status(self):
        status = self.client.status()
        return status

    def send_status(self, event):
        self.broadcast_event(event, self.get_status())

    send_info = lambda self: self.send_status('info')
    send_response = lambda self: self.send_status('response')

    def _send_command(self, cmd):
        logger.info('sending command: %s', cmd)
        ret = getattr(self.client, cmd)()

    # TODO set this up at runtime
    on_stop = lambda self: self._send_command('stop')
    on_next = lambda self: self._send_command('next')
    on_previous = lambda self: self._send_command('previous')
    on_pause = lambda self: self._send_command('pause')
    on_unpause = lambda self: self._send_command('play')

    def on_play(self, song_id):
        #self.client.play(song_id + 1)
        pass

    def on_info(self):
        self.send_info()

    def on_time(self, time):
        try:
            time = float(time)
            if 100 < time < 0:
                raise ValueError
        except ValueError:
            pass
        else:
            self.client.seek(time)

    def on_volume(self, volume):
        try:
            volume = int(volume)
            if 100 < volume < 0:
                raise ValueError
        except ValueError:
            pass
        else:
            self.client.setvol(volume)

    def on_playlist_add(self, song_id, idx):
        pass

    def on_playlist_move(self, from_idx, to_idx):
        pass
