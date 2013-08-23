import os
import re
import json
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _

from player.metadata import get_song_metadata

class SongManager(models.Manager):
    """
    Manager for the Song model, adding some basic factory methods.
    """
    def create(self, path, save=False, *args, **kwargs):
        """
        Create a Song, guessing its metadata based on the path given.
        Raises an IOError if the audio file couldn't be read.
        """
        metadata = get_song_metadata(path)
        for key, value in metadata.iteritems():
            kwargs.setdefault(key, value)
        kwargs['path'] = path
        song = Song(*args, **kwargs)
        if save:
            try:
                song.clean()
                #song.full_clean()
                song.save()
            except ValidationError:
                msg = 'Song model cannot be saved: validation failed'
                raise ValueError(msg)
        return song

    def broken(self):
        """
        Return a queryset for the songs whose "path" is invalid.
        """
        songs = self.all()
        excluded_ids = []
        for song in songs:
            if not song.file_exists():
                excluded_ids.append(song.id)
        return songs.filter(id__in=excluded_ids)

class Song(models.Model):
    """
    Song model, main purpose.
    """
    path = models.CharField(_('Path to file'), max_length=255, editable=False)
    duration = models.IntegerField(_('Duration in seconds'), blank=True, null=True)
    title = models.CharField(_('Title'), max_length=100, blank=True)
    artist = models.CharField(_('Artist'), max_length=100, blank=True)
    album = models.CharField(_('Album name'), max_length=100, blank=True)
    track_number = models.SmallIntegerField(_('Track number'), blank=True, null=True)
    year = models.CharField(_('Year'), max_length=4, blank=True)
    play_count = models.IntegerField(_('Play count'), default=0)

    def clean(self):
        # path to file must exist
        if not self.file_exists():
            raise ValidationError('File "%s" does not exist' % self.path)
        def reformat_to_int(field, default=None):
            """
            Refactoring of the save cleaning method applied to
            both "duration" and "track_number".
            """
            if field is not None:
                field = re.sub(r'[^\d]', '', field)
            if not field or field < 0:
                field = default
            return field
        self.track_number = reformat_to_int(self.track_number)
        self.duration = reformat_to_int(self.duration)
        return super(Song, self).clean()

    def file_exists(self):
        """
        Return if the file at the models "path" exists.
        """
        return os.path.exists(self.path)

    def json(self):
        """
        Encode the Song object as a JSON string.
        """
        return json.dumps(self.__dict__)

    def __unicode__(self):
        return self.title or self.path

    def update_from_file(self):
        pass

    objects = SongManager()
