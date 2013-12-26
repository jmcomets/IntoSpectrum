import os
import sys
from gevent import monkey; monkey.patch_all()
from flask import Flask, request, jsonify, abort
from socketio import socketio_manage
from player import client, database
from player.namespace import Namespace as PlayerNamespace
import settings

logger = settings.getLogger(__name__)

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
    socketio_manage(request.environ, { '/player': PlayerNamespace }, request)

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

@app.route('/api/songs/<song_id>/')
def find_song(song_id):
    try:
        return jsonify(database.find_song_by_id(int(song_id)))
    except (TypeError, ValueError):
        abort(404)

if __name__ == '__main__':
    import shlex, subprocess as sp
    from werkzeug.wsgi import SharedDataMiddleware
    from socketio.server import SocketIOServer

    # start mpd
    logger.info('starting mpd')
    mpd_retcode = sp.call(shlex.split(settings.MPD_COMMAND),
            stdout=sp.PIPE, stderr=sp.PIPE)
    if mpd_retcode != 0:
        logger.warning('mpd exit code %s, may be already started', mpd_retcode)
    else:
        logger.info('mpd started')
    client.connect(settings.MPD_HOST, settings.MPD_PORT)

    # setup database
    client.get_client().update()
    database.generate()

    # start server
    host, address = settings.FLASK_HOST, settings.FLASK_PORT
    app.debug = '--debug' in sys.argv or settings.DEBUG
    logger.info('server started on http://%s:%s, debug=%s',
            host, address, app.debug)
    real_app = SharedDataMiddleware(app, { '/': public_dir })
    server = SocketIOServer((host, address), real_app,
            namespace='socket.io', policy_server=False)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info('server stopped')
    except Exception as e:
        logger.exception(e)
