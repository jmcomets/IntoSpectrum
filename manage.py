#!/usr/bin/env python

from os import environ as env
env.setdefault('DJANGO_SETTINGS_MODULE', 'into_spectrum.settings')

if __name__ == '__main__':
    from sys import argv
    from django.core.management import execute_from_command_line
    execute_from_command_line(argv)
