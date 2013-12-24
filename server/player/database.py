from .client import Client

_client = Client()
_database = [s['file'] for s in _client.listall() if 'file' in s]

def get_songs(offset, limit):
    songs = []
    try:
        limit = min(offset + limit, len(_database)) - offset
        _client.command_list_ok_begin()
        for song in _database[offset:offset+limit]:
            _client.find('file', song)
        songs = [s[0] for s in _client.command_list_end()]
    except IndexError as e:
        pass
    return songs

def find_song_by_id(id_):
    song = {}
    if 0 <= song_id < len(_database):
        song = _database[song_id]
    return song
