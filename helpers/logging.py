import os
def _import_logging():
    """
    Import the standard "logging" module, knowing that
    this module has the same name.
    """
    import imp
    import sys
    file_, pathname, desc = imp.find_module('logging', sys.path[1:])
    module = imp.load_module('logging', file_, pathname, desc)
    return module
logging = _import_logging()
from django.conf import settings

def getLogger(name):
    """
    Global setup of logging, adding two handlers with different levels,
    a StreamHandler with the ERROR level, and a FileHandler with the
    DEBUG level. Log files are stored under settings.LOGS_DIR, with
    filename "name" and extension ".log".
    When settings.DEBUG is True, the logger will have its level globally
    set to DEBUG.
    Example:
    >>> from helpers import logging
    >>> logger = logging.getLogger(__name__)
    """
    logger = logging.getLogger(name)
    if settings.DEBUG:
        logger.setLevel(logging.DEBUG)
    logger_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    formatter = logging.Formatter(logger_format)
    # add file handler with debug level
    fh = logging.FileHandler(os.path.join(settings.LOGS_DIR,
        '%s.log' % name.replace('.', '-')))
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    # add console handler with error level
    ch = logging.StreamHandler()
    ch.setLevel(logging.ERROR)
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    return logger
