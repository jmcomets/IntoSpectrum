import os
import sys
from gevent import monkey; monkey.patch_all()
from flask import Flask, request, jsonify, abort
from socketio import socketio_manage
import settings
from player import Namespace, Client, database

host, address = settings.FLASK_HOST, settings.FLASK_PORT

this_dir = os.path.dirname(os.path.realpath(__file__))
public_dir = os.path.join(this_dir, '..', 'public')
app = Flask('IntoSpectrum', static_folder=public_dir, static_url_path='')
client = Client()

@app.route('/socket.io/<path:path>')
def run_socketio(path):
    socketio_manage(request.environ, { '/player': Namespace })

@app.route('/')
def root():
    return app.send_static_file('index.html')

# song database api

@app.route('/api/songs/')
def get_songs():
    try:
        offset = int(request.args.get('offset', 0))
        limit = int(request.args.get('limit', 100))
    except ValueError:
        abort(404)
    songs = database.get_songs(offset, limit)
    return jsonify({ 'songs': songs, 'next': len(songs) > 0 })

@app.route('/api/songs/:song_id/')
def find_song(song_id):
    print song_id
    try:
        return jsonify(database.find_song_by_id(int(song_id)))
    except ValueError:
        abort(404)

if __name__ == '__main__':
    from werkzeug.wsgi import SharedDataMiddleware
    from socketio.server import SocketIOServer
    print 'Listening on http://%s:%s' % (host, address)
    app.debug = '--debug' in sys.argv
    real_app = SharedDataMiddleware(app, { '/': public_dir })
    SocketIOServer((host, address), real_app, namespace='socket.io',
            policy_server=False).serve_forever()
