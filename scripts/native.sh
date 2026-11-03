#!/usr/bin/env bash
set -euo pipefail

# Keep machine-specific toolchain fixes inside this process, never in shell files.
if [[ "$(uname)" == Darwin ]]; then
  if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  fi
  if [[ "${2:-}" == ios ]] && command -v brew >/dev/null 2>&1; then
    # Inspect installed opt links without asking Homebrew to refresh its API.
    hexdrop_prefix="$(cd "$(dirname "$(command -v brew)")/.." && pwd -P)"
    hexdrop_ruby="$hexdrop_prefix/opt/ruby"
    hexdrop_pods="$hexdrop_prefix/opt/cocoapods"
    if [[ -x "$hexdrop_ruby/bin/ruby" && -d "$hexdrop_pods/libexec" ]]; then
      # Homebrew CocoaPods must use the gems from its current Ruby, not an older
      # Ruby directory left in GEM_PATH after a Homebrew upgrade.
      hexdrop_gems="$("$hexdrop_ruby/bin/ruby" -rrubygems -e 'print Gem.default_dir')"
      hexdrop_ruby_api="$("$hexdrop_ruby/bin/ruby" -rrbconfig -e 'print RbConfig::CONFIG["ruby_version"]')"
      export GEM_PATH="$hexdrop_pods/libexec:$hexdrop_ruby/lib/ruby/gems/$hexdrop_ruby_api:$hexdrop_gems"
    fi
  fi
fi

exec ns "$@"
