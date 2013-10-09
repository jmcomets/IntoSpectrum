import pexpect
from collections import namedtuple

class MPlayer:
  def __init__(self):
    self._proc = pexpect.spawn('mplayer', timeout=5,
      args=[
        '-slave',
        '-idle',
        '-quiet',
        '-vo', 'null',
        '-softvol',
        '-nolirc'])
    self._proc.flush()

    Property = namedtuple('Property', 'gettable settable type')
    self._prop = {
        'length'    : Property(True,    False,  'time'),
        'time_pos'  : Property(True,    True,   'time'),
        'pause'     : Property(True,    False,  'flag'),
        'filename'  : Property(True,    False,  'string'),
        'volume'    : Property(True,    True,   'float')
    }

  def _write(self, data, expect = None):
    print 'STDIN:', data
    self._proc.write(data + '\n')
    re = None
    if expect is not None:
      re = self._proc.expect(expect)
    self._proc.flush()
    return re

  def _getProperty(self, name):
    if name in self._prop and self._prop[name].gettable:
      prop = self._prop[name]

      base_expected = [#'ANS_ERROR=PROPERTY_UNAVAILABLE',
          'Failed to get value of property \'' + name + '\'.',
          pexpect.TIMEOUT]
      if prop.type == 'time':
        exp = ['ANS_' + name + '=(\d+\.\d+)']
      elif prop.type == 'float':
        exp = ['ANS_' + name + '=(\d+\.\d+)']
      elif prop.type == 'int':
        exp = ['ANS_' + name + '=(\d+)']
      elif prop.type == 'string':
        exp = ['ANS_' + name + '=([-.0-9a-zA-Z_ ]+)']
      elif prop.type == 'flag':
        exp = ['ANS_' + name + '=yes', 'ANS_' + name + '=no']
      exp = exp + base_expected

      index = self._write('pausing_keep_force get_property ' + name, exp)
      if prop.type == 'flag':
        if index == 0:
          return True
        if index == 1:
          return False
      if index == 0:
        data = self._proc.match.group(1)
        if prop.type == 'float':
          return float(data)
        if prop.type == 'time':
          return float(data)
        if prop.type == 'int':
          return int(data)
        if prop.type == 'string':
          return data
    return None

  def _setProperty(self, name, value):
    if name in self._prop and self._prop[name].settable:
      prop = self._prop[name]
      self._write('pausing_keep_force set_property ' + name + ' ' + str(value))

  def kill(self, signal):
    # TODO
    pass

  def quit(self, code = 0):
    self._write('quit ' + str(code))
    self._proc.wait()

  def loadfile(self, filename, append = '0'):
    self._write('loadfile "' + filename + '" ' + str(append),
        ['Starting playback...',
          'Failed to open ' + filename + '.',
          pexpect.TIMEOUT])

  def forcePause(self):
    if self.isPaused() is False:
      self._write('pause')

  def forceUnpause(self):
    if self.isPaused() is True:
      self._write('pause')

  def songOver(self):
    return self.getFilename() is None

  def getFilename(self):
    return self._getProperty('filename')

  def getVolume(self):
    return self._getProperty('volume')

  def getTimePos(self):
    return self._getProperty('time_pos')

  def getLength(self):
    return self._getProperty('length')

  def isPaused(self):
    return self._getProperty('pause')

  def setTimePos(self, value):
    self._setProperty('time_pos', value)

  def setVolume(self, value):
    self._setProperty('volume', value)

if __name__ == '__main__':
  mplayer = MPlayer()
  print mplayer.getFilename()
  print mplayer.getTimePos()
  print mplayer.getLength()
  print mplayer.getVolume()
  print mplayer.isPaused()
  mplayer.loadfile('../../media/MGMT/Electric Feel - Justice remix.mp3')
  mplayer.setTimePos(10)
  mplayer.setVolume(50)
  mplayer.forcePause()
  print mplayer.getFilename()
  print mplayer.getTimePos()
  print mplayer.getLength()
  print mplayer.getVolume()
  print mplayer.isPaused()
  mplayer.forceUnpause()
  print mplayer.isPaused()
  mplayer.quit()

# vim: ft=python et sw=2 sts=2
