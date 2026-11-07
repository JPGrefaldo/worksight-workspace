import json, sys
st, proxy = sys.argv[1], sys.argv[2]
c = json.load(open('/tmp/claude-0/compose.json'))
svc = {}
def S(n): return svc.setdefault(n, {})
for n, s in c['services'].items():
    df = (s.get('build') or {}).get('dockerfile', '')
    if df in ('ruby.Dockerfile', 'node.Dockerfile'):
        S(n)['build'] = {'context': st + '/build', 'dockerfile': df}
penv = {'HTTP_PROXY': proxy, 'HTTPS_PROXY': proxy, 'http_proxy': proxy, 'https_proxy': proxy,
        'NO_PROXY': 'localhost,127.0.0.1', 'no_proxy': 'localhost,127.0.0.1', 'BUNDLE_SSL_CA_CERT': '/etc/ssl/certs/ccr-ca.crt'}
S('worksight-deps').update({'network_mode': 'host', '__reset_networks': True, 'environment': penv,
    'command': ['bash', '-c', 'git config --global --add safe.directory /repo; bash /repo/infra/docker/bundle-install.sh && mkdir -p node_modules/.bin']})
up = {'PILET_FEED_UPSTREAM': 'http://pilet-mirror:8000'}
dep = {'pilet-mirror': {'condition': 'service_started'}}
S('pilet-feed').update({'environment': up, 'depends_on': dep})
S('pilet-server').update({'environment': up, 'depends_on': dep})
S('worksight-assets').update({'command': ['bash', '-c', 'mkdir -p public/assets/esbuild && cp -a /esb/. public/assets/esbuild/ && echo assets: copied the development build'],
    'volumes': [st + '/esbuild:/esb:ro']})
S('pilet-mirror').update({'image': 'worksight-node:22.23.4', 'profiles': ['frontend', 'all', 'full', 'shell'], 'working_dir': '/mirror',
    'volumes': [st + '/mirror:/mirror:ro', st + '/mirror-server.mjs:/mirror-server.mjs:ro'], 'command': ['node', '/mirror-server.mjs']})
lines = ['services:']
for n, s in svc.items():
    lines.append(f'  {n}:')
    reset = s.pop('__reset_networks', False)
    if reset: lines.append('    networks: !reset null')
    for k, v in s.items():
        lines.append(f'    {k}: ' + json.dumps(v))
open(st + '/override.yml', 'w').write('\n'.join(lines) + '\n')
