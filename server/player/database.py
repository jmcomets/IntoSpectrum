import settings
from .client import get_client

logger = settings.getLogger(__name__)

_files = []

def generate():
    """
    (re)Generate song database.
    """
    # grab and reset globals
    global _files
    _files = []
    _directories = []

    # (re)generate
    client = get_client()
    for song in client.playlistinfo():
        _files.append(song)
    logger.info('database generated')

def get_current_song():
    """
    Get the current playing song.
    """
    return get_client().currentsong()

def get_songs(offset, limit):
    """
    Get the songs in the database in the interval (offset, offset + limit),
    returning correctly formatted songs ordered by their database id.
    """
    try:
        limit = min(offset + limit, len(_files)) - offset
        return _files[offset:offset+limit]
    except IndexError as e:
        logger.warning('bad index given while getting songs: %s', e)
    return []

def find_song_by_id(id_):
    if id_ > 0 and id_ < len(_files):
        return _files[id_]
