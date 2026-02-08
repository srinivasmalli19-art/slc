import urllib.request
import sys

url = 'http://127.0.0.1:8001/test'
try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as r:
        print('STATUS', r.status)
        for k, v in r.getheaders():
            print(f'{k}: {v}')
        body = r.read()
        print('BODY LEN', len(body))
        try:
            print(body.decode('utf-8'))
        except Exception:
            print(repr(body))
except Exception as e:
    print('ERROR', e, file=sys.stderr)
