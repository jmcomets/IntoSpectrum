from django.conf.urls import patterns, include, url

# Enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'', include('player.urls', 'player')),
    url(r'^admin/', include(admin.site.urls)),
)
