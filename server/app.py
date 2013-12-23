import os
import sys
from flask import Flask, request, Response
from socketio import socketio_manage
from player import PlayerNamespace

this_dir = os.path.dirname(os.path.realpath(__file__))
public_dir = os.path.join(this_dir, '..', 'public')
app = Flask('IntoSpectrum', static_folder=public_dir, static_url_path='')

@app.route('/socket.io/<path:path>')
def run_socketio(path):
    real_request = request._get_current_object()
    kwargs = { '/player': PlayerNamespace }
    socketio_manage(request.environ, kwargs, request=real_request)
    return Response()

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/api/songs/')
def get_songs():
    pass

@app.route('/api/songs/:id/')
def find_song():
    pass

if __name__ == '__main__':
    app.run(debug='--debug' in sys.argv)
