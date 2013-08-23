import os
import re
import time
import datetime
import functools
import threading
from django.conf import settings
from django.db import transaction

from player.models import Song
from helpers import logging

logger = logging.getLogger(__name__)

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
    Finder looking recursively under every directory in settings.MEDIA_ROOT
    for supported audio files (extensions listed in SongFinder.SUPPORTED_FORMATS),
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
    SUPPORTED_FORMATS = ('flac', 'mp3', 'ogg', 'wav',)
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
                r'(', r'|'.join(self.SUPPORTED_FORMATS), r')',
                r'$',
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
        # wait initial time
        if getattr(self, '_wait', 0):
            logging.info('Waiting %s seconds until first run')
            time.sleep(self._wait)
        # do cycles (run finder)
        def finder_cycles():
            """
            Generator for looping until the finder is stopped,
            handing out the index of the current cycle.
            """
            i = 0
            yield i
            while not self._stopped.wait(self._interval):
                i += 1
                yield i
        for _ in finder_cycles():
            logger.info('Waking up')
            self.run_finder()
            logger.info('Going to sleep')

    def stop(self, wait=False):
        """
        Request stop the finder (applied at the end of the current update).
        If wait is True, block until the end of the current update.
        """
        logger.info('Stop requested')
        self._stopped.set()
        if wait:
            logger.info('Waiting for current run to finish')
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
        recursively into every directory listed in settings.MEDIA_ROOT
        (in order), and update (or insert) the Song model with the
        corresponding path.
        """
        try:
            logger.info('Deleting broken songs')
            # delete all broken songs
            Song.objects.broken().delete()
            # find all audio files in settings.MEDIA_ROOT
            found_songs = []
            logger.info('Walking directory "%s"' % settings.MEDIA_ROOT)
            for root, _, filenames in os.walk(settings.MEDIA_ROOT):
                for fname in filenames:
                    if re.match(self._audio_file_re, fname):
                        rel_root = root[len(settings.MEDIA_ROOT)+1:]
                        full_fname = os.path.join(rel_root, fname)
                        found_songs.append(full_fname)
            logger.info('Found %s audio files' % len(found_songs))
            found_songs_set = set(found_songs)
            # update all songs information
            all_songs = Song.objects.all()
            song_is_found = lambda s: s.path in found_songs_set
            songs_to_update = filter(song_is_found, all_songs)
            updated_songs = []
            for song in songs_to_update:
                song.update_from_file()
                updated_songs.append(song.path)
            logger.info('Updated %s existing songs' % len(updated_songs))
            # insert new songs
            new_songs = list(found_songs_set - set(updated_songs))
            logger.info('Inserting %s new songs' % len(new_songs))
            for s in new_songs:
                try:
                    song = Song.objects.create(s, save=True)
                except ValueError:
                    msg = 'Song insertion failed for "%s"' % s
                    #logger.warning(msg)
        except:
            logger.exception('Rollback')
            transaction.rollback()
        else:
            logger.info('Commit')
            transaction.commit()
