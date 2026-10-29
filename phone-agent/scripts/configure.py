#!/usr/bin/env python3
"""Run interactively over SSH. Secrets are entered without terminal echo."""
import argparse
import getpass
import os
from pathlib import Path
import re
import secrets

parser = argparse.ArgumentParser()
parser.add_argument('--prepare', action='store_true', help='Create a disabled server config without asking for API credentials')
parser.add_argument('--enable', action='store_true', help='Enable for controlled calls to the new test number; does not forward KPN')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
target = root / '.env.phone-agent'
values = {}
if target.exists():
    for line in target.read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            values[key] = value
defaults = {
    'PHONE_AGENT_ENABLED': 'false', 'PHONE_AGENT_PORT': '3010',
    'PHONE_AGENT_MODEL': 'gpt-realtime-2.1-mini',
    'PHONE_AGENT_TRANSCRIPTION_MODEL': 'gpt-transcribe',
    'PHONE_AGENT_VOICE': 'marin', 'PHONE_AGENT_ALLOWED_NUMBERS': '',
    'PHONE_AGENT_INTERNAL_SECRET': secrets.token_hex(32),
    'PHONE_AGENT_TRANSFER_NUMBER': '', 'PHONE_AGENT_MAX_CONCURRENT': '3',
    'PHONE_AGENT_MAX_CALLS_PER_DAY': '30', 'PHONE_AGENT_MAX_SECONDS': '240',
}
values = {**defaults, **values}
values['PHONE_AGENT_ENABLED'] = 'false'
if not args.prepare:
    for key, label in [('OPENAI_API_KEY', 'OpenAI project API key'), ('OPENAI_WEBHOOK_SECRET', 'OpenAI webhook signing secret')]:
        supplied = getpass.getpass(label + ' (hidden; Enter keeps existing): ').strip()
        if supplied:
            if '\n' in supplied or '\r' in supplied or not re.fullmatch(r'[A-Za-z0-9_+/=.-]+', supplied):
                raise SystemExit('Unexpected characters in credential; nothing was saved.')
            values[key] = supplied
    number = input('New Twilio Dutch voice number, e.g. +31201234567 (Enter keeps existing): ').strip()
    if number:
        if not re.fullmatch(r'\+31[1-9][0-9]{8}', number) or number == '+31203412995':
            raise SystemExit('Use the NEW Dutch Twilio number, not the existing KPN number. Nothing was saved.')
        values['PHONE_AGENT_ALLOWED_NUMBERS'] = number
    limit = input('Maximum AI calls per day [30]: ').strip()
    if limit:
        if not limit.isdigit() or not 1 <= int(limit) <= 1000:
            raise SystemExit('Invalid daily limit; nothing was saved.')
        values['PHONE_AGENT_MAX_CALLS_PER_DAY'] = limit
    if args.enable:
        required = ['OPENAI_API_KEY', 'OPENAI_WEBHOOK_SECRET', 'PHONE_AGENT_ALLOWED_NUMBERS']
        if any(not values.get(key) for key in required):
            raise SystemExit('Missing credentials/number; nothing was saved.')
        values['PHONE_AGENT_ENABLED'] = 'true'
for key, value in values.items():
    if '\n' in value or '\r' in value:
        raise SystemExit('Invalid configuration; nothing was saved.')
temporary = target.with_name(target.name + '.tmp')
descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(descriptor, 'w', encoding='utf-8', newline='\n') as file:
    file.write('\n'.join(key + '=' + value for key, value in values.items()) + '\n')
os.chmod(temporary, 0o600)
os.replace(temporary, target)
os.chmod(target, 0o600)
print('Configuration saved securely. Enabled: ' + values['PHONE_AGENT_ENABLED'])
print('Restart only the assistant: pm2 restart shah-phone-agent --update-env')
print('KPN forwarding has NOT been changed.')
