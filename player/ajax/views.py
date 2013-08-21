from django.http import Http404
from helpers.http import JSONResponse
from player.models import Song

def add(request):
    """
    Add a new song to the library, given the path its audio file.
    Only accepts POST, path must be given in the 'path' argument.
    """
    if request.method == 'POST':
        path = request.POST.get('path')
        if path is not None:
            song = Song.objects.create_song(path, save=True)
            return JSONResponse(song.json())
    raise Http404

