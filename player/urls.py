from django.conf.urls import patterns, include, url
from player import views

urlpatterns = patterns('',
        url(r'^$', views.IndexView.as_view()),
        url(r'^index$', views.IndexView.as_view(), name='index'),
        url(r'^search$', views.SearchView.as_view(), name='search'),
        )
