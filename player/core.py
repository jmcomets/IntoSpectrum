import glob
import time
import datetime
import threading
from django.conf import settings

class SongFinder(object):
    """
    Finder looking recursively under every directory in settings.SONGS_DIRS
    for supported audio files, searching for matches in Song models, and
    updating the database with the modifications.
    """
    def __init__(self, timeout=None, date=None):
        """
        Setup a song finder for threadingG
        - Timeout :
          Interval (in seconds) to repeat the "update" method,
          that is run the finder.
        - Date :
          datetime.datetime object representing the date at which
          the finder should be first started.
        """
        self._stopped = threading.Event()
        self._stopped.set()
        if timeout is not None:
            timeout = int(timeout)
            self.repeat_every(timeout)
        if date is not None:
            assert isinstance(date, datetime.datetime)
            self.start_after((date - datetime.datetime.now()).seconds)

    def start_after(self, seconds):
        """
        Configure SongFinder to start after 'n' seconds.
        """
        if self.started:
            raise RuntimeError('SongFinder already started')
        assert isinstance(seconds, int) and seconds > 0
        self._wait = seconds

    def repeat_every(self, seconds):
        """
        Configure SongFinder to repeat every 'n' seconds.
        """
        if self.started:
            raise RuntimeError('SongFinder already started')
        assert isinstance(seconds, int) and seconds > 0
        self._interval = seconds

    def start(self):
        """
        Start the finder (only if it is properly configured).
        """
        if not hasattr(self, '_interval'):
            raise RuntimeError('SongFinder not configured')
        worker = threading.Thread(target=self._run)
        worker.daemon = True
        self._stopped.clear()
        worker.start()

    def _run(self):
        if getattr(self, '_wait', 0):
            time.sleep(self._wait)
        while not self._stopped.wait(self._interval):
            pass # TODO

    def stop(self):
        self._stopped.set()

    @property
    def started(self):
        """
        Return if the finder is started.
        """
        return not self._stopped.is_set()
