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

    self._gettable = [
        'length',
        'time_pos',
        'pause',
        'filename',
        'volume']

    self._settable = [
        'time_pos',
        'volume']

    Property = namedtuple('Property', 'gettable settable type')
    self._prop = {
        'length'    : Property(True,    False,  'time'),
        'time_pos'  : Property(True,    True,   'time'),
        'pause'     : Property(True,    False,  'flag'),
        'filename'  : Property(True,    False,  'string'),
        'volume'    : Property(True,    True,   'float')
    }

  def getProperty(self, name):
    if name in self._prop and self._prop[name].gettable:
      prop = self._prop[name]
      self._proc.write('pausing_keep_force get_property ' + name + '\n')

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

      index = self._proc.expect(exp)
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
    self._proc.flush()
    return None

  def quit(self):
    self._proc.write('quit\n')
    self._proc.wait()

mplayer = MPlayer()
mplayer._proc.write('loadfile \
"/home/turpif/Projet/IntoSpectrum/media/MGMT/Electric Feel - Justice remix.mp3" \
0\n');
print mplayer.getProperty('filename')
print mplayer.getProperty('time_pos')
print mplayer.getProperty('length')
print mplayer.getProperty('volume')
print mplayer.getProperty('pause')
print mplayer.getProperty('pause')
print mplayer.getProperty('pause')
mplayer.quit()
