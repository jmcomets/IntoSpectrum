from django.conf.urls import patterns, include, url

urlpatterns = patterns('player.ajax.views',
        url(r'^add$', 'add', name='add'),
        )
