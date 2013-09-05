IntoSpectrum
============

Server-side media player with a web front-end, written in NodeJS.

The interface is based on [Bootstrap 2.3.2][] and [Bootstrap JQuery UI][].


Note that IntoSpectrum doesn't create the library for you,
at least not with the web app.

Instead, it comes with a *watchdog* utility script, which can be
launched once, or as a daemon process.

### Why IntoSpectrum ?

Its an anagram of the original author's last names, and also happens
to correspond to one of our favorite pokemon.

![Spectrum image][]

## Requirements

- [Node.js][] (at least v0.10.17)
- [Mplayer][]
- [MySQL][] (current engine)

### Watchdog requirements

- [Python 2.7][]
- [mutagen][]
- [peewee][]

[Virtualenv][] is recommended for deploying the watchdog.

## Authors
- [Jean-Marie Comets][]
- [Pierre Turpin][]

[Python 2.7]: http://www.python.org/download/releases/2.7
[mutagen]: https://code.google.com/p/mutagen
[MySQL]: http://www.mysql.com
[Virtualenv]: http://www.virtualenv.org
[peewee]: https://github.com/coleifer/peewee
[Node.js]: http://nodejs.org
[Mplayer]: http://mplayerhq.hu
[Bootstrap 2.3.2]: https://github.com/twbs/bootstrap/tree/v2.3.2
[Bootstrap JQuery UI]: https://github.com/addyosmani/jquery-ui-bootstrap
[Spectrum image]: ../../blob/master/static/img/spectrum.jpg?raw=true
[Jean-Marie Comets]: https://github.com/jmcomets
[Pierre Turpin]: https://github.com/TurpIF
