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

def value_checked(f):
    """
    Decorator wrapping any function that raises a ValueError, logging any
    failures.
    """
    @wraps(f)
    def inner(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning('invalid value sent: %s', e)
    return inner

def not_implemented(f):
    """
    Decorator wrapping any function, marking it as not implemented, and
    replacing its call with a simple log message.
    """
    @wraps(f)
    def inner(*args, **kwargs):
        logger.error('%s not implemented', f.func_name)
    if inner.func_doc is None:
        inner.func_doc = ''
    inner.func_doc += 'Marked as not implemented.'
    return inner

class Namespace(BaseNamespace, BroadcastMixin, ScheduleMixin):
    """
    Player socket namespace, handling all global player controls, such as
    play/pause/stop/etc, as well as volume and player status updating.
    """
    UPDATE_INTERVAL = 5

    def __init__(self, *args, **kwargs):
        super(Namespace, self).__init__(*args, **kwargs)
        logger.info('initializing namespace')
        self.client = get_client()
        self.schedule_every(self.update, self.UPDATE_INTERVAL, target_id=__name__)

    def __getattribute__(self, attr):
        """
        Wrap on_* callables, in order to log events and send responses.
        """
        actual_attr = super(Namespace, self).__getattribute__(attr)
        if attr.startswith('on_') and callable(actual_attr):
            event = attr.replace('on_', '', 1)
            logger.info('event: %s', event)
            if event != 'info':
                @wraps(actual_attr)
                def inner(*args, **kwargs):
                    retval = actual_attr(*args, **kwargs)
                    self.send_response()
                    return retval
                return inner
        return actual_attr

    def get_status(self):
        """
        Wrapper to get client status.
        """
        return self.client.status()

    def send_status(self, event, single=False):
        """
        Send a status update specified with a particular event, defining the
        update behaviour. If single evaluates to True, update only this
        namespace's client, otherwise broadcast to all. Return the status sent.
        """
        status = self.get_status()
        if single:
            self.emit(event, status)
        else:
            self.broadcast_event(event, status)
        return status

    # wrappers for status updates

    send_info = lambda self: self.send_status('info')
    send_response = lambda self: self.send_status('response')

    def update(self):
        """
        Send a status update marked as 'info' and log it. This method is
        scheduled to run every UPDATE_INTERVAL seconds.
        """
        logger.info('status: %s', self.send_info())

    def send_command(self, cmd):
        """
        Send a command to the mdp client, handling any possible errors, and
        returning the command's output.
        """
        logger.info('sending command: %s', cmd)
        try:
            ret = getattr(self.client, cmd)()
        except mpd.CommandError as e:
            logger.warning('not a command: %s', cmd)
        else:
            return ret

    def on_info(self):
        """
        Explicit request for status update.
        """
        self.send_info()

    # TODO set this up at runtime

    on_stop = lambda self: self.send_command('stop')
    on_next = lambda self: self.send_command('next')
    on_previous = lambda self: self.send_command('previous')
    on_pause = lambda self: self.send_command('pause')
    on_unpause = lambda self: self.send_command('play')

    @not_implemented
    def on_play(self, song_id):
        """
        Request to play a specific song by its database id.
        """
        #self.client.play(song_id + 1)
        pass

    @value_checked
    def on_time(self, time):
        """
        Request to set the current song's time.
        """
        time = float(time)
        if time < 0:
            raise ValueError
        self.client.seek(time)

    @value_checked
    def on_volume(self, volume):
        """
        Request to set the player's volume.
        """
        volume = int(volume)
        if 100 < volume < 0:
            raise ValueError
        self.client.setvol(volume)

    def on_random(self, random):
        """
        Request to set the random mode (evaluated as a bool).
        """
        self.client.random(int(bool(random)))

    def on_repeat(self, repeat):
        """
        Request to set the repeat mode (evaluated as a bool).
        """
        self.client.repeat(int(bool(repeat)))
