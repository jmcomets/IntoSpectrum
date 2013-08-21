import os
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _
from player import core

class SongManager(models.Manager):
    """
    Manager for the Song model, adding some basic factory methods.
    """
    def create_song(path, *args, **kwargs):
        """
        Create a Song, guessing its metadata based on the path given.
        Raises an IOError if the audio file couldn't be read.
        """
        metadata = core.get_song_metadata(path)
        for key, value in metadata.iteritems():
            kwargs.setdefault(key, value)
        kwargs['path'] = path
        return Song(*args, **kwargs)

class Song(models.Model):
    """
    Song model, main purpose.
    """
    path = models.CharField(_('Path to file'), max_length=255, editable=False)
    duration = models.IntegerField(_('Duration in seconds'), blank=True)
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
        # if track_number is invalid, set to none
        if self.track_number is not None and self.track_number < 0:
            self.track_number = None
        # if duration is invalid, set to none
        if self.duration is not None and self.duration < 0:
            self.duration = None
        return super(Song, self).clean()

    def file_exists(self):
        """
        Return if the file at the models "path" exists.
        """
        return os.path.exists(self.path)

    def __unicode__(self):
        return "%s" % (self.title or self.path)

    objects = SongManager()
