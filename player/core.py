import os
import re
import time
import datetime
import threading
from django.conf import settings

# Default settings
settings.SONG_DIRS = (
        settings.MEDIA_ROOT,
        )
settings.SONG_FORMATS = (
        'mp3',
        'flac',
        'ogg',
        'wav'
        )

class SongFinder(object):
    """
    Finder looking recursively under every directory in settings.SONG_DIRS
    for supported audio files (extensions listed in settings.SONG_FORMATS),
    searching for matches in Song models, and updating the database with
    the modifications.

    Example usage:
      >>> import time
      >>> from player.core import SongFinder
      >>> sf = SongFinder(1)
      >>> sf.start()
      >>> time.sleep(2)
      >>> sf.stop(True)
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
        audio_file_re = r''.join([
                r'(?i)',
                r'^.*\.',
                r'|'.join(settings.SONG_FORMATS),
                r'$'
                ])
        self._audio_file_re = re.compile(audio_file_re)

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
        self._worker = threading.Thread(target=self._run)
        self._worker.daemon = True
        self._stopped.clear()
        self._worker.start()

    def _run(self):
        if getattr(self, '_wait', 0):
            time.sleep(self._wait)
        while not self._stopped.wait(self._interval):
            self.run_finder()

    def stop(self, wait=False):
        """
        Request stop the finder (applied at the end of the current update).
        If wait is True, block until the end of the current update.
        """
        self._stopped.set()
        if wait:
            self._worker.join()

    @property
    def started(self):
        """
        Return if the finder is started.
        """
        return not self._stopped.is_set()

    def run_finder(self):
        """
        Actually run the finder (block the current thread), descending
        recursively into every directory listed in settings.SONG_DIRS
        (in order), and update (or insert) the Song model with the
        corresponding path.
        """
        def found_audio_files():
            """
            Generator expression for looping over all audio files (in order
            of priority), matched by their extension.
            """
            for song_dir in settings.SONG_DIRS:
                for root, _, filenames in os.walk(song_dir):
                    for fname in filenames:
                        if re.match(self._audio_file_re, fname):
                            full_fname = os.path.join(root, fname)
                            yield full_fname
        for audio_file in found_audio_files():
            pass # TODO
