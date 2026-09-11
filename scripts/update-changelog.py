#!/usr/bin/env python3
"""Prepend a release entry to docs/CHANGELOG.md.

Called only from .github/workflows/docker-publish.yml, right after a
version is validated and just before it's committed — never run this by
hand. Keeping it in one place is what keeps the changelog's version and
package.json's version from drifting apart.

Reads RELEASE_VERSION (x.y.z) and RELEASE_LOG (the changelog body, usually
a commit-log bullet list) from the environment.
"""

import datetime
import os
import pathlib

version = os.environ["RELEASE_VERSION"]
log = os.environ["RELEASE_LOG"]

path = pathlib.Path("docs/CHANGELOG.md")
text = path.read_text()
today = datetime.date.today().isoformat()
entry = f"## [{version}] - {today}\n\n### Changes\n{log}\n\n"

marker = "Newest at the top.\n"
idx = text.index(marker) + len(marker)
rest = text[idx:].lstrip("\n")  # drop the existing blank line before the first entry
new_text = text[:idx] + "\n" + entry + rest

path.write_text(new_text)
