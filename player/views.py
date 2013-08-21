from django.views.generic import TemplateView, ListView, DetailView
from player.models import Song

class IndexView(ListView):
    model = Song
    template_name = 'index.html'
