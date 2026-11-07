import json, os, re, ssl, sys, urllib.parse, urllib.request
base, out = sys.argv[1], sys.argv[2]
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
pat = re.compile(r'''(?:from\s*|import\s*\(\s*|import\s*|url\(\s*)["']?((?:\.{1,2}/|/assets/esbuild/)[^"')\s?#]+)''')
seen = set()
def get(rel):
    rel = os.path.normpath(rel)
    if rel in seen or rel.startswith('..'): return
    seen.add(rel)
    try:
        body = urllib.request.urlopen(base + '/' + rel, context=ctx, timeout=120).read()
    except Exception as e:
        print('miss', rel, e); return
    dest = os.path.join(out, rel); os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'wb').write(body)
    if rel.endswith(('.js', '.css')):
        d = os.path.dirname(rel)
        for m in pat.findall(body.decode('utf-8', 'ignore')):
            get(m[len('/assets/esbuild/'):] if m.startswith('/assets/esbuild/') else os.path.join(d, m))
for f in json.load(open(os.path.join(out, '.manifest.json'))).values():
    get(f)
print('files', len(seen))
