#!/usr/bin/env bash
set -euo pipefail

# Installs the Claude SEO skill (https://github.com/AgriciDaniel/claude-seo)
# into ~/.claude for a Claude Code session, then wires it up for remote
# (cloud) sessions where the Playwright CDN is unreachable:
#   1. Runs the upstream installer (skills, subagents, Python runtime).
#   2. If Chromium download failed, links the environment's pre-installed
#      Chromium (/opt/pw-browsers) into the layout Playwright expects.
#   3. Imports the agent-proxy CA bundle into the browser NSS store so
#      headless Chromium trusts the proxy's re-terminated TLS.
#
# Safe to re-run; each step is skipped when already satisfied.

SKILL_DIR="${HOME}/.claude/skills/seo"
MSPW="${SKILL_DIR}/ms-playwright"
PW_PREINSTALLED="/opt/pw-browsers"
CA_BUNDLE="${HOME}/.ccr/ca-bundle.crt"

# 1. Upstream install (idempotent: overwrites skill files in place).
if [ ! -x "${SKILL_DIR}/bin/claude-seo" ]; then
    tmp=$(mktemp -d)
    trap 'rm -rf -- "${tmp}"' EXIT
    git clone --depth 1 https://github.com/AgriciDaniel/claude-seo.git "${tmp}/claude-seo"
    bash "${tmp}/claude-seo/install.sh" || true
fi

# 2. Link pre-installed Chromium if the runtime's browser download failed.
if [ -d "${PW_PREINSTALLED}" ] && [ -x "${SKILL_DIR}/.venv/bin/python" ]; then
    expected_rev=$("${SKILL_DIR}/.venv/bin/python" - <<'EOF'
import json, pathlib, sys
site = next(pathlib.Path(sys.prefix, "lib").glob("python*/site-packages"))
data = json.loads((site / "playwright/driver/package/browsers.json").read_text())
print(next(b["revision"] for b in data["browsers"] if b["name"] == "chromium"))
EOF
)
    have_rev=$(ls "${PW_PREINSTALLED}" | sed -n 's/^chromium-\([0-9]*\)$/\1/p' | head -1)
    if [ -n "${have_rev}" ] && [ ! -e "${MSPW}/chromium-${expected_rev}" ]; then
        mkdir -p "${MSPW}/chromium-${expected_rev}"
        ln -sfn "${PW_PREINSTALLED}/chromium-${have_rev}/chrome-linux" \
            "${MSPW}/chromium-${expected_rev}/chrome-linux64"
        touch "${MSPW}/chromium-${expected_rev}/INSTALLATION_COMPLETE" \
              "${MSPW}/chromium-${expected_rev}/DEPENDENCIES_VALIDATED"
        hs_src="${PW_PREINSTALLED}/chromium_headless_shell-${have_rev}/chrome-linux"
        hs_dst="${MSPW}/chromium_headless_shell-${expected_rev}/chrome-headless-shell-linux64"
        if [ -d "${hs_src}" ]; then
            mkdir -p "${hs_dst}"
            for f in "${hs_src}"/*; do ln -sfn "${f}" "${hs_dst}/$(basename "${f}")"; done
            ln -sfn "${hs_src}/headless_shell" "${hs_dst}/chrome-headless-shell"
            touch "${hs_dst}/../INSTALLATION_COMPLETE" "${hs_dst}/../DEPENDENCIES_VALIDATED"
        fi
        ffmpeg_src=$(ls -d "${PW_PREINSTALLED}"/ffmpeg-* 2>/dev/null | head -1)
        [ -n "${ffmpeg_src}" ] && ln -sfn "${ffmpeg_src}" "${MSPW}/$(basename "${ffmpeg_src}")"
        # Tell the claude-seo runtime the browser is available.
        "${SKILL_DIR}/.venv/bin/python" - <<'EOF'
import json, os, pathlib
p = pathlib.Path.home() / ".claude/skills/seo/runtime-state.json"
if p.exists():
    s = json.loads(p.read_text())
    s["browser_ready"] = True
    p.write_text(json.dumps(s, indent=2, sort_keys=True))
EOF
    fi
fi

# 3. Trust the agent-proxy CA in the NSS store Chromium reads on Linux.
if [ -f "${CA_BUNDLE}" ]; then
    command -v certutil >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq libnss3-tools; }
    nssdb="${HOME}/.pki/nssdb"
    mkdir -p "${nssdb}"
    [ -f "${nssdb}/cert9.db" ] || certutil -d "sql:${nssdb}" -N --empty-password
    if ! certutil -d "sql:${nssdb}" -L 2>/dev/null | grep -q "ccr-proxy-ca-0"; then
        tmp_certs=$(mktemp -d)
        ( cd "${tmp_certs}" && csplit -s -z -f cacert- "${CA_BUNDLE}" '/-----BEGIN CERTIFICATE-----/' '{*}' )
        i=0
        for f in "${tmp_certs}"/cacert-*; do
            certutil -d "sql:${nssdb}" -A -t "C,," -n "ccr-proxy-ca-${i}" -i "${f}" || true
            i=$((i+1))
        done
        rm -rf -- "${tmp_certs}"
    fi
fi

"${SKILL_DIR}/bin/claude-seo" doctor
