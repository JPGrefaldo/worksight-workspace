import base64, json, sys, html
st = sys.argv[1]; sh = st + '/shots'
off = {r['name']: r for r in json.load(open(sh + '/flags-off-results.json'))}
on = {r['name']: r for r in json.load(open(sh + '/flags-on-results.json'))}
rows = [('1095-C', '1095c'), ('Tax Withholding', 'taxes'), ('Life Events', 'life-events'), ('Pay History', 'pay-history'), ('Organization', 'organization')]
def src(r):
    if r['status'] == 'timeout': return 'did not load'
    eng = any(p.startswith('/hris/') for p in r['graphql'])
    return ('HRIS engine + main app' if eng else 'main app') + (' · ' + '; '.join(a.rstrip('×') for a in r['alerts']) if r['alerts'] else '')
def img(label, name):
    b = base64.b64encode(open(f"{sh}/{label}-{name}.png", 'rb').read()).decode()
    return f'<img alt="{label} {name}" src="data:image/png;base64,{b}">'
parts = []
for title, key in rows:
    parts.append(f'<section><h2>{title}</h2><div class="grid">')
    for side in ('main', 'pilet'):
        n = f'{key}-{side}'
        for label, res in (('flags-off', off), ('flags-on', on)):
            r = res[n]
            parts.append(f'<figure><figcaption><b>{"Main app" if side=="main" else "Pilet"}</b>, {label.replace("-", " ")}<br><code>{html.escape(r["path"])}</code><br>Data: {html.escape(src(r))}</figcaption>{img(label, n)}</figure>')
    parts.append('</div></section>')
parts.append(f'<section><h2>My Profile (main app only)</h2><div class="grid"><figure><figcaption>flags off</figcaption>{img("flags-off","my-profile-main")}</figure><figure><figcaption>flags on</figcaption>{img("flags-on","my-profile-main")}</figure></div></section>')
page = f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HRIS Local Stack</title>
<style>:root{{--bg:#fff;--fg:#1a1a1a;--muted:#5b5b5b;--line:#ddd}}@media (prefers-color-scheme:dark){{:root{{--bg:#151515;--fg:#eee;--muted:#aaa;--line:#333}}}}
body{{background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif;margin:0 auto;padding:16px;max-width:1400px}}
h1{{font-size:22px}} h2{{font-size:18px;border-top:1px solid var(--line);padding-top:14px}} p{{color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}} figure{{margin:0}} figcaption{{font-size:13px;color:var(--muted);margin-bottom:6px}}
img{{width:100%;border:1px solid var(--line);border-radius:6px}} code{{font-size:12px}}</style></head><body>
<h1>HRIS pages on the local stack (./up.sh all prismhr, development 0d08b67e, assets built from this checkout)</h1>
<p>Signed in as the seeded employee persona (Erin Employee, client 1, synthetic data from the PrismHR fake). "Flags on" = HRIS_SERVICE_ENABLED plus the five HRIS_ESS_* page flags for client 1. "Data" lists which GraphQL endpoint each page called from the browser.</p>
{''.join(parts)}</body></html>'''
open(st + '/hris-local-gallery.html', 'w').write(page)
