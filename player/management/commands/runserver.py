from django.core.management.commands.runserver \
        import Command as RunServerCommand
from django.conf import settings
from player.core import SongFinder

class Command(RunServerCommand):
    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.song_finder = SongFinder(*settings.SONGFINDER_SCHEDULING)

    def run(self, *args, **kwargs):
        """
        Same as inherited runserver Command run() method,
        but also calls startup() and shutdown() events.
        """
        self.startup()
        ret = super(Command, self).run(*args, **kwargs)
        self.shutdown()
        return ret

    def startup(self):
        """
        Event fired right before starting the server.
        """
        self.song_finder.start()

    def shutdown(self):
        """
        Event fired right after stopping the server.
        """
        self.song_finder.stop(wait=True)
