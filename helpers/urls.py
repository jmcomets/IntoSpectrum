def required(patterns, *wrappers):
    """
    Used to require 1..n decorators in any view returned by a url tree

    Usage:
      urlpatterns = required(patterns(...), f1, ..., fN)

    Note:
      Use functools.partial to pass keyword arguments to the required
      decorators. If you need to pass args you will have to write a
      wrapper function.

    Example:
      from functools import partial

      urlpatterns = required(
          patterns(...),
          partial(login_required, login_url='/accounts/login/')
      )
    """
    return [_wrap_instance_resolve(wrappers, p) for p in patterns]

def _wrap_instance_resolve(wrappers, instance):
    if not hasattr(instance, 'resolve'):
        return instance
    resolve = getattr(instance, 'resolve')
    def _wrap_func_in_returned_resolver_match(*args, **kwargs):
        rslt = resolve(*args, **kwargs)
        if not hasattr(rslt, 'func'):
            return rslt
        f = getattr(rslt, 'func')
        for _f in reversed(wrappers):
            # @decorate the function from inner to outter
            f = _f(f)
        setattr(rslt, 'func', f)
        return rslt
    setattr(instance, 'resolve', _wrap_func_in_returned_resolver_match)
    return instance

