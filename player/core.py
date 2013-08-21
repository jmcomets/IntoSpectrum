import os
import re
import time
import datetime
import functools
import threading
from django.conf import settings
from django.db import transaction

from player.models import Song

_library_lock = threading.Lock()
def locks_library(f):
    """
    Decorator locking the library (puts the app
    in maintenance mode).
    """
    @functools.wraps(f)
    def closure(*args, **kwargs):
        global _library_lock
        _library_lock.lock()
        f(*args, **kwargs)
        _library_lock.unlock()
    return f

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
            print 'Waiting'
            self._worker.join()

    @property
    def started(self):
        """
        Return if the finder is started.
        """
        return not self._stopped.is_set()

    @locks_library
    @transaction.commit_manually
    def run_finder(self):
        """
        Actually run the finder (block the current thread), descending
        recursively into every directory listed in settings.SONG_DIRS
        (in order), and update (or insert) the Song model with the
        corresponding path.
        """
        try:
            print 'Deleting broken songs'
            # delete all broken songs
            Song.objects.broken().delete()
            # find all audio files in settings.SONG_DIRS
            found_audio_files = []
            print 'Walking dirs %s' % settings.SONG_DIRS
            for song_dir in settings.SONG_DIRS:
                for root, _, filenames in os.walk(song_dir):
                    for fname in filenames:
                        if re.match(self._audio_file_re, fname):
                            full_fname = os.path.join(root, fname)
                            found_audio_files.append(full_fname)
            print 'Found audio files %s' % found_audio_files
            # update all songs information
            songs = Song.objects.filter(path__in=found_audio_files)
            updated_songs = []
            for song in songs:
                song.update_from_file()
                updated_songs.append(song.path)
            print 'Updated existing songs %s' % updated_songs
            # insert new songs
            new_songs = [set(found_audio_files) - set(updated_songs)]
            print 'Inserting new songs %s' % new_songs
            for s in new_songs:
                song = Song.objects.create(s, save=True)
                print 'Saving new song %s' % song
        except Exception as e:
            print 'Rollback because of %s' % e.strerror()
            transaction.rollback()
        else:
            print 'Commit'
            transaction.commit()
