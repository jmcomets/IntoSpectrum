from flask_socketio import FlaskNamespace
import mpd

class PlayerNamespace(FlaskNamespace):
    def on_info(self, msg):
        print 'info:', msg
    def on_next(self):
        pass
    def on_previous(self):
        pass
