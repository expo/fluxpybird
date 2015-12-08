#!/usr/local/bin/python

import os
import base64
import string

DIR = os.getcwd() + '/media/'
EXTS = ['.png', '.ttf']

print "'use strict';"
print
print 'export default {'

for fname in os.listdir(DIR):
    if any(fname.endswith(ext) for ext in EXTS):
        with open(DIR + fname, 'rb') as f:
            enc = base64.b64encode(f.read())
            print "    ['{0}']: 'data:image/png;base64,{1}',".format(fname, enc)

print '};'
