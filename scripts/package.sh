#!/usr/bin/env bash
# Builds the static site and lays it out for upload to public_html:
#   coffee.html         -> mujtabakhan.com/coffee.html
#   coffee/static/...   -> JS, CSS, fonts, images (renamed from Next's "_next" —
#                          some hosting file managers reject names starting with "_")
#   coffee/images/...   -> social-share image
#   coffee/icon.svg     -> favicon
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf out dist
npm run build

mkdir -p dist/coffee/images
cp out/coffee.html.html dist/coffee.html
cp -R out/_next/static dist/coffee/static
# Drop unreferenced build manifests (their names start with "_")
find dist/coffee/static -name '_*' -delete
find dist/coffee/static -type d -empty -delete
# Point every reference at /coffee/static/... instead of /coffee/_next/static/...
grep -rl '/coffee/_next/' dist | while read -r f; do
  perl -pi -e 's#/coffee/_next/#/coffee/#g' "$f"
done
if grep -rq '/coffee/_next/' dist; then echo "ERROR: unrewritten _next paths remain" >&2; exit 1; fi
if find dist -name '_*' | grep -q .; then echo "ERROR: files starting with _ remain" >&2; exit 1; fi
cp out/icon.svg dist/coffee/icon.svg
cp out/images/cta-cup.jpg dist/coffee/images/cta-cup.jpg

# Caching rules scoped to /coffee only (does not touch the site's root .htaccess)
cat > dist/coffee/.htaccess <<'HT'
Options -Indexes
<IfModule mod_headers.c>
  <If "%{REQUEST_URI} =~ m#^/coffee/static/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
  <Else>
    Header set Cache-Control "public, max-age=604800"
  </Else>
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/css application/javascript image/svg+xml
</IfModule>
HT

(cd dist && rm -f ../noire-coffee-upload.zip && zip -qr ../noire-coffee-upload.zip coffee.html coffee)
echo "Done: dist/ and noire-coffee-upload.zip ($(du -h noire-coffee-upload.zip | cut -f1))"
