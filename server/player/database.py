import threading
import settings
from .client import get_client

logger = settings.getLogger(__name__)

_directories = []
_files = []
_lock = threading.Lock()

def generate():
    """
    (re)Generate song database.
    """
    # grab and reset globals
    global _files
    global _directories
    _files = []
    _directories = []

    # (re)generate
    client = get_client()
    for i, song in enumerate(client.listall()):
        if 'file' in song:
            _files.append(song['file'])
        elif 'directory' in song:
            _directories.append(song['directory'])
        else:
            logger.warning('unknown song format: %s', song)
    logger.info('database generated')

def get_songs(offset, limit):
    """
    Get the songs in the database in the interval (offset, offset + limit),
    returning correctly formatted songs ordered by their database id.
    """
    songs = []
    client = get_client()
    try:
        limit = min(offset + limit, len(_files)) - offset
        client.command_list_ok_begin()
        for song in _files[offset:offset+limit]:
            client.find('file', song)
        songs = []
        for i, song in enumerate(s[0] for s in client.command_list_end()):
            song['id'] = i + offset
            songs.append(song)
        return  songs
    except IndexError as e:
        logger.warning('bad index given while getting songs: %s', e)
    return songs

def find_song_by_id(id_):
    if id_ > 0 and id_ < len(_files):
        client = get_client()
        song = client.find('file', _files[id_])[0]
        song['id'] = id_
        return song
