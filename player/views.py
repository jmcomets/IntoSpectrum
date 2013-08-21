from django.shortcuts import render
from django.http import Http404
from django.views.decorators.http import require_GET, require_POST
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from player.models import Song

@require_GET
def index(request, page=None):
    paginator = Paginator(Song.objects.all(), 500)
    try:
        songs = paginator.page(page)
    except PageNotAnInteger:
        songs = paginator.page(1)
    except EmptyPage:
        raise Http404
    return render(request, 'index.html', { 'songs': songs })

@require_POST
def search(request, by=None):
    query = request.GET['query']
    songs = Song.objects.search(query, by)
    return render(request, 'search.html', { 'songs': songs })
