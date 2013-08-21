import os

# require the mutagen package
try:
    import mutagen
except ImportError:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('The mutagen python package is required')

def get_song_metadata(path):
    """
    Get the metadata for a song, given a path (recommended absolute) to
    this song. Returns a dictionary (see key->value pairs below).
    Raises an IOError if the path is invalid or the audio file is bad.
    """
    if not os.path.exists(path):
        raise IOError('File "%s" does not exist' % path)
    file_ = mutagen.File(path)
    if file_ is None:
        raise IOError('Error when reading "%s"' % path)
    def get_id3_tag(key, default=None):
        """
        Get an ID3 tag from "file_" defined above, returning default
        if the key isn't valid (returns a string if valid).
        Keys are ID3 standards (see http://en.wikipedia.org/wiki/ID3)
        """
        id3_keys = {
                'title': 'TIT2',
                'album': 'TALB',
                'artist': 'TPE1',
                'duration': 'TLEN',
                'year': 'TDRC',
                'track_number': 'TRCK',
                }
        assert key in id3_keys
        try:
            return str(file_[id3_keys[key]])
        except KeyError:
            return default
    metadata_items = (
            'title',
            'album',
            'artist',
            'duration',
            'year',
            'track_number',
            #'genre',
            # TODO
            )
    return { key : get_id3_tag(key) for key in metadata_items }
