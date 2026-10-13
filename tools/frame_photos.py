#!/usr/bin/env python3
"""Resize, strip, and encrypt photos for webc/frame.html.

Usage:
    FRAME_PASSPHRASE='...' python tools/frame_photos.py ~/Downloads/PortalPhotos

Re-running with the same passphrase only adds photos that aren't already in the
frame. The passphrase is never written to disk; without FRAME_PASSPHRASE set the
script prompts for it.

Output (all public, all useless without the passphrase):
    webc/photos/key.json      PBKDF2 salt + iteration count
    webc/photos/manifest.bin  encrypted list of photos
    webc/photos/<id>.bin      encrypted WebP, one per photo

Every encrypted file is a 12-byte AES-GCM IV followed by the ciphertext, which
is the layout frame.html decrypts with WebCrypto.

Requires: pip install pillow cryptography
"""
import base64
import getpass
import io
import json
import os
import secrets
import sys
from concurrent.futures import ProcessPoolExecutor

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from PIL import Image, ImageOps

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'webc', 'photos')
SCREEN = (1280, 800)       # Portal 10" / Portal Go
QUALITY = 85
ITERATIONS = 600_000
EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif', '.bmp', '.tif', '.tiff')


def derive_key(passphrase, salt, iterations):
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iterations)
    return kdf.derive(passphrase.encode())


def encrypt(key, data):
    iv = secrets.token_bytes(12)
    return iv + AESGCM(key).encrypt(iv, data, None)


def decrypt(key, blob):
    return AESGCM(key).decrypt(blob[:12], blob[12:], None)


def process(args):
    """Fit one photo to the screen, re-encode as WebP with no metadata, encrypt it."""
    key, path = args
    try:
        im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    except Exception as e:
        return path, None, str(e)
    box = SCREEN if im.width >= im.height else SCREEN[::-1]
    im.thumbnail(box, Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=QUALITY, method=5)   # no exif= so GPS/camera data is dropped
    photo_id = secrets.token_hex(8)
    with open(os.path.join(OUT, photo_id + '.bin'), 'wb') as f:
        f.write(encrypt(key, buf.getvalue()))
    return path, photo_id, None


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = os.path.expanduser(sys.argv[1])
    passphrase = os.environ.get('FRAME_PASSPHRASE') or getpass.getpass('Passphrase: ')
    os.makedirs(OUT, exist_ok=True)

    key_path = os.path.join(OUT, 'key.json')
    manifest_path = os.path.join(OUT, 'manifest.bin')
    if os.path.exists(key_path):
        meta = json.load(open(key_path))
    else:
        meta = {'v': 1, 'kdf': 'PBKDF2-SHA256', 'iterations': ITERATIONS,
                'salt': base64.b64encode(secrets.token_bytes(16)).decode()}
    key = derive_key(passphrase, base64.b64decode(meta['salt']), meta['iterations'])

    photos = []
    if os.path.exists(manifest_path):
        try:
            photos = json.loads(decrypt(key, open(manifest_path, 'rb').read()))['photos']
        except Exception:
            sys.exit('Wrong passphrase for the existing photos in ' + OUT)

    done = {p['src'] for p in photos}
    todo = [os.path.join(root, name)
            for root, _, names in os.walk(src) for name in sorted(names)
            if name.lower().endswith(EXTS) and os.path.relpath(os.path.join(root, name), src) not in done]
    print(f'{len(photos)} already in frame, {len(todo)} to add')

    with ProcessPoolExecutor() as pool:
        for i, (path, photo_id, err) in enumerate(pool.map(process, [(key, p) for p in todo], chunksize=8), 1):
            if err:
                print(f'skip {path}: {err}')
            else:
                photos.append({'id': photo_id, 'src': os.path.relpath(path, src)})
            if i % 250 == 0:
                print(f'  {i}/{len(todo)}')

    with open(key_path, 'w') as f:
        json.dump(meta, f)
    with open(manifest_path, 'wb') as f:
        f.write(encrypt(key, json.dumps({'photos': photos}).encode()))
    print(f'{len(photos)} photos in frame')


if __name__ == '__main__':
    main()
