from django.conf.urls import patterns, include, url
from helpers.urls import required, view_is_ajax
from player import views

urlpatterns = patterns('player.views',
        url(r'^(?P<page>\d+)?$', 'index', name='index'),
        url(r'^search$', 'search', name='search'),
        )
urlpatterns += required(patterns('',
    url('^ajax/', include('player.ajax.urls', 'ajax')),
    ), view_is_ajax)
