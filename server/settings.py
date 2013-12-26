import logging

# flask
FLASK_HOST, FLASK_PORT = '127.0.0.1', 8080

# mpd
MPD_COMMAND = 'mpd'
MPD_HOST, MPD_PORT = '127.0.0.1', 6600

def getLogger(name):
    logging_level = logging.DEBUG if DEBUG else logging.INFO
    logger = logging.getLogger(name)
    logger.setLevel(logging_level)
    ch = logging.StreamHandler()
    ch.setLevel(logging_level)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    return logger

# debug level
DEBUG = True
