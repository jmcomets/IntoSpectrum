import os
import sys
from gevent import monkey; monkey.patch_all()
from flask import Flask, request, jsonify, abort
from socketio import socketio_manage
import player
from player import database

this_dir = os.path.dirname(os.path.realpath(__file__))
public_dir = os.path.join(this_dir, '..', 'public')
app = Flask('IntoSpectrum', static_folder=public_dir, static_url_path='')

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('img/favicon.ico')

@app.route('/socket.io/<path:path>')
def socketio_service(path):
    socketio_manage(request.environ, { '/player': player.Namespace }, request)

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
    try:
        return jsonify(database.find_song_by_id(int(song_id)))
    except ValueError:
        abort(404)

if __name__ == '__main__':
    from werkzeug.wsgi import SharedDataMiddleware
    from socketio.server import SocketIOServer
    import settings
    host, address = settings.FLASK_HOST, settings.FLASK_PORT
    print 'Server started on http://%s:%s' % (host, address)
    app.debug = '--debug' in sys.argv or settings.DEBUG
    real_app = SharedDataMiddleware(app, { '/': public_dir })
    SocketIOServer((host, address), real_app, namespace='socket.io',
            policy_server=False).serve_forever()
