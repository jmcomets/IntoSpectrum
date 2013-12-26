import settings
from .client import get_client

logger = settings.getLogger(__name__)

_database = []

def generate():
    global _database
    _database = []
    client = get_client()
    for i, song in enumerate(client.listall()):
        if 'file' not in song:
            continue
        _database.append(song['file'])
    logger.info('database generated')

def get_songs(offset, limit):
    songs = []
    client = get_client()
    try:
        limit = min(offset + limit, len(_database)) - offset
        client.command_list_ok_begin()
        for song in _database[offset:offset+limit]:
            client.find('file', song)
        songs = []
        for i, song in enumerate(s[0] for s in client.command_list_end()):
            song['id'] = i + offset
            songs.append(song)
        return  songs
    except IndexError as e:
        pass
    return songs

def find_song_by_id(id_):
    if id_ > 0 and id_ < len(_database):
        client = get_client()
        song = client.find('file', _database[id_])[0]
        song['id'] = id_
        return song
