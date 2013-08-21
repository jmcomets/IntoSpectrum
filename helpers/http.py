import json
from django.http import HttpResponse, Http404

def JSONResponse(data=None, *args, **kwargs):
    """
    Simple wrapper for HttpResponse, setting up HTTP configuration
    for a JSON response.
    """
    # Argument duck-typing (can take str or object or nothing)
    if data is None:
        data = json.dumps({})
    elif not isinstance(data, str):
        data = json.dumps(data)
    # Content-type set in the response's header
    json_ct = 'application/json'
    return HttpResponse(data, content_type=json_ct, *args, **kwargs)
