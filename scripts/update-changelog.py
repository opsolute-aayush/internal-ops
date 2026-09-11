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
text = path.read_text() if path.exists() else "# Changelog\n"
today = datetime.date.today().isoformat()
entry = f"## [{version}] - {today}\n\n### Changes\n{log}\n\n"

# Insert right after the first line (the "# Changelog" title) — deliberately
# NOT anchored to any specific sentence of intro prose. An earlier version
# of this script searched for a marker string in that prose, which broke
# the moment someone edited the file's intro text by hand (exactly what
# happened: a manual edit removed the sentence this script was looking
# for, and the release workflow failed on the next run). The title line is
# a much safer anchor — it's the one thing this file is guaranteed to keep.
lines = text.splitlines(keepends=True)
if not lines:
    lines = ["# Changelog\n"]
title, rest = lines[0], lines[1:]
new_text = title + "\n" + entry + "".join(rest).lstrip("\n")

path.write_text(new_text)
