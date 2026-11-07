import json, os, re, ssl, sys, urllib.parse, urllib.request
base, out, feed = sys.argv[1], sys.argv[2], sys.argv[3]
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
items = json.load(open(feed))['items']
ref = re.compile(r'["\'`]((?:\./|/)?[\w@./-]+?\.(?:js|css|json|map|svg|png|woff2?|ttf))["\'`]')
seen, total = set(), 0
def get(path):
    global total
    if path in seen: return
    seen.add(path)
    try:
        body = urllib.request.urlopen(urllib.request.Request(base + path), context=ctx, timeout=60).read()
    except Exception as e:
        return
    dest = os.path.join(out, path.lstrip('/'))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'wb').write(body); total += 1
    if path.endswith(('.js', '.css', '.json')):
        d = path.rsplit('/', 1)[0]
        text = body.decode('utf-8', 'ignore')
        for mp, ext in re.findall(r'\(\{((?:\d+:"[\w-]+",?)+)\}\[\w+\]\+"(\.(?:js|css))"\)', text):
            for h in re.findall(r'\d+:"([\w-]+)"', mp):
                get(urllib.parse.urljoin(d + '/', h + ext))
        for m in ref.findall(text):
            if m.startswith('/') or '..' in m or m.startswith('http'): continue
            get(urllib.parse.urljoin(d + '/', m))
for it in items:
    link = it['link'].split('?')[0]
    get(urllib.parse.unquote(link))
    root = link.rsplit('/', 1)[0]
    for f in it.get('spec', '') and [] or []: pass
print('files', total)
