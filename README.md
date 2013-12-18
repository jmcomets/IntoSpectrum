IntoSpectrum
============

Server-side media player with a web front-end, written in NodeJS.

The interface is mainly based on [Bootstrap 3][].


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
- [Mongodb][] (current engine)

## Deploying

All client and server dependencies are included in the [bower.json][] and [package.json][] files, and so the installation of the server, assuming that all system requirements are met, is as simple as `npm install`, and the server can then be started by running `npm start`.

### Development server

A [Gruntfile.js][] is available for running a development server, notably the `dev` task with will watch all js, css and less files for instant-regeneration.

## Authors
- [Jean-Marie Comets][]
- [Pierre Turpin][]

[package.json]: ../../blob/master/package.json
[bower.json]: ../../blob/master/bower.json
[Gruntfile.js]: ../../blob/master/Gruntfile.js
[Node.js]: http://nodejs.org
[Mongodb]: http://www.mongodb.org
[Mplayer]: http://mplayerhq.hu
[Bootstrap 3]: http://getbootstrap.com
[Spectrum image]: ../../blob/master/client/img/spectrum.jpg?raw=true
[Jean-Marie Comets]: https://github.com/jmcomets
[Pierre Turpin]: https://github.com/TurpIF
