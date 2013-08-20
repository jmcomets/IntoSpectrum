import os
from django.db import models
from django.utils.translation import ugettext_lazy as _

class Song(models.Model):
    path = models.CharField(max_length=255)
    duration = models.IntegerField(_('Duration in seconds'), editable=False)
    title = models.CharField(_('Title'), max_length=100)
    artist = models.CharField(_('Artist'), max_length=100, blank=True)
    album = models.CharField(_('Album name'), max_length=100, blank=True)
    track_number = models.SmallIntegerField(_('Track number'), blank=True, null=True)
    track_total = models.SmallIntegerField(_('Total track count'), blank=True, null=True)
    genre = models.CharField(_('Genre'), max_length=50, blank=True)
    disc_number = models.SmallIntegerField(_('Disc number'), blank=True, null=True)
    disc_total = models.SmallIntegerField(_('Total disc count'), blank=True, null=True)
    year = models.CharField(_('Year'), max_length=4, blank=True)
    publisher = models.CharField(_('Publisher'), max_length=100, blank=True)
    play_count = models.IntegerField(_('Play count'), default=0)

    def save(self, *args, **kwargs):
        # TODO read from
        super(Song, self).save(*args, **kwargs)

    def __unicode__(self):
        return "%s" % self.title

    def file_exists(self):
        return os.path.exists(self.path)
