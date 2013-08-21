from django.conf.urls import patterns, include, url
from helpers.urls import required, view_is_ajax
from player import views

urlpatterns = patterns('',
        url(r'^$', views.IndexView.as_view()),
        url(r'^index$', views.IndexView.as_view(), name='index'),
        )
urlpatterns += required(patterns('',
    url('^ajax/', include('player.ajax.urls', 'ajax')),
    ), view_is_ajax)
