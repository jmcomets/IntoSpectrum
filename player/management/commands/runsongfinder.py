from django.core.management import BaseCommand
from player.core import SongFinder

class Command(BaseCommand):
    help = 'Runs a SongFinder once, updating the database Song models'

    def handle(self, *args, **kwargs):
        sf = SongFinder(42)
        sf.start()
        sf.stop(wait=True)
