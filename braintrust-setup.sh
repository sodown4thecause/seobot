#!/bin/sh

set -e
VERSION=""
if [ "$#" -gt 0 ]; then
	case "$1" in
	-*) ;;
	*)
		VERSION="$1"
		shift
		;;
	esac
fi
REPO="braintrustdata/spark"
BIN_NAME="braintrust-setup"

red() { printf '\033[0;31m%s\033[0m\n' "$*" >&2; }
die() {
	red "Error: $*"
	exit 1
}

need_cmd() {
	command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

extract_tag_name() {
	if command -v jq >/dev/null 2>&1; then
		jq -r '(if type == "array" then .[0] else . end).tag_name // empty'
	else
		grep -o '"tag_name" *: *"[^"]*"' | head -n 1 | sed 's/.*: *"//' | tr -d '"'
	fi
}

extract_stable_tags() {
	if command -v jq >/dev/null 2>&1; then
		jq -r '.[] | select(.prerelease == false) | .tag_name' | head -n 5
	else
		grep -o '"tag_name" *: *"[^"]*"' | sed 's/.*: *"//;s/"//' | grep '^v' | grep -v '-' | head -n 5
	fi
}

find_bin() {
	_name="$1"
	_found=""
	_xdg_bin="${XDG_BIN_HOME:-}"
	_local_bin="$HOME/.local/bin"
	_cargo_bin="${CARGO_HOME:-$HOME/.cargo}/bin"
	for _dir in "$_xdg_bin" "$_local_bin" "$_cargo_bin"; do
		[ -z "$_dir" ] && continue
		if [ -x "$_dir/$_name" ]; then
			_found="$_dir/$_name"
			break
		fi
	done
	if [ -z "$_found" ] && command -v "$_name" >/dev/null 2>&1; then
		_found=$(command -v "$_name")
	fi
	printf '%s' "$_found"
}

pretty_path() {
	_path="$1"
	case "$_path" in
	"$HOME"/*) printf '~/%s' "${_path#"$HOME"/}" ;;
	*) printf '%s' "$_path" ;;
	esac
}

bin_search_paths() {
	_name="$1"
	_xdg_bin="${XDG_BIN_HOME:-}"
	_local_bin="$HOME/.local/bin"
	_cargo_bin="${CARGO_HOME:-$HOME/.cargo}/bin"
	_paths=""
	for _dir in "$_xdg_bin" "$_local_bin" "$_cargo_bin"; do
		[ -z "$_dir" ] && continue
		_paths="$_paths $(pretty_path "$_dir/$_name")"
	done
	printf '%s' "$_paths"
}

detect_target() {
	_os=$(uname -s)
	_arch=$(uname -m)
	case "$_os" in
	Darwin) _os_tag="darwin" ;;
	Linux) _os_tag="linux" ;;
	*) die "Unsupported OS: $_os. Braintrust setup wizard is only available for macOS and Linux." ;;
	esac
	case "$_arch" in
	x86_64 | amd64) _arch_tag="x64" ;;
	arm64 | aarch64) _arch_tag="arm64" ;;
	*) die "Unsupported architecture: $_arch" ;;
	esac
	printf '%s-%s' "$_os_tag" "$_arch_tag"
}

install_dir() {
	_dir="${XDG_BIN_HOME:-$HOME/.local/bin}"
	mkdir -p "$_dir"
	printf '%s' "$_dir"
}

gh_api() {
	curl -fsSL -H "Accept: application/vnd.github.v3+json" "https://api.github.com/$1"
}

install_wizard() {
	need_cmd curl
	_releases=""
	if [ -z "$VERSION" ]; then
		_tag=$(gh_api "repos/$REPO/releases/latest" | extract_tag_name)
		[ -n "$_tag" ] || die "Could not determine latest stable Braintrust setup wizard release from GitHub."
	else
		_tag="$VERSION"
	fi
	_target=$(detect_target)
	_asset="$BIN_NAME-$_target.tar.gz"
	_asset_url="https://github.com/$REPO/releases/download/$_tag/$_asset"
	_dest_dir=$(install_dir)
	_dest="$_dest_dir/$BIN_NAME"
	_tmp_dir=$(mktemp -d)
	_tmp="$_tmp_dir/$_asset"
	trap 'rm -rf "$_tmp_dir"' EXIT INT TERM
	if ! curl -fsSL -o "$_tmp" "$_asset_url" 2>/dev/null; then
		_asset="spark-$_target.tar.gz"
		_asset_url="https://github.com/$REPO/releases/download/$_tag/$_asset"
		_tmp="$_tmp_dir/$_asset"
		if ! curl -fsSL -o "$_tmp" "$_asset_url" 2>/dev/null; then
			red "Could not download Braintrust setup wizard version '$_tag' for target '$_target'."
			red "Incorrect version '$VERSION' or unsupported target '$_target'. The latest stable versions are:"
			[ -n "$_releases" ] || _releases=$(gh_api "repos/$REPO/releases?per_page=20")
			_stable_list=$(printf '%s' "$_releases" | extract_stable_tags | tr '\n' ' ')
			red "  stable $_stable_list"
			exit 1
		fi
	fi
	need_cmd tar
	tar -xzf "$_tmp" -C "$_tmp_dir" || die "Failed to extract Braintrust setup wizard archive."
	if [ -f "$_tmp_dir/$BIN_NAME" ]; then
		_extracted="$_tmp_dir/$BIN_NAME"
	elif [ -f "$_tmp_dir/spark" ]; then
		_extracted="$_tmp_dir/spark"
	else
		die "Downloaded archive did not contain the Braintrust setup wizard binary."
	fi
	chmod +x "$_extracted"
	mv "$_extracted" "$_dest"
	rm -rf "$_tmp_dir"
	trap - EXIT INT TERM
}

run_wizard() {
	_wizard=$(find_bin "$BIN_NAME")
	[ -n "$_wizard" ] || die "Braintrust setup wizard binary not found after installation. Looked in:$(bin_search_paths "$BIN_NAME")."
	_os=$(uname -s)
	if [ "$_os" = "Darwin" ]; then
		if [ -t 0 ]; then
			script -q /dev/null "$_wizard" "$@"
		elif (: </dev/tty) 2>/dev/null; then
			script -q /dev/null "$_wizard" "$@" </dev/tty
		else
			"$_wizard" "$@"
		fi
	else
		if [ -t 0 ]; then
			"$_wizard" "$@"
		elif [ -e /dev/tty ]; then
			"$_wizard" "$@" </dev/tty
		else
			red "No interactive terminal available to start the Braintrust setup wizard. Run this command manually after installation:"
			printf '  %s' "$(pretty_path "$_wizard")" >&2
			for _arg in "$@"; do
				case "$_arg" in
				"") printf " ''" >&2 ;;
				*[!A-Za-z0-9_./:=+-]*)
					_quoted=$(printf '%s' "$_arg" | sed "s/'/'\\\\''/g")
					printf " '%s'" "$_quoted" >&2
					;;
				*) printf ' %s' "$_arg" >&2 ;;
				esac
			done
			printf '\n' >&2
			exit 1
		fi
	fi
}

main() {
	install_wizard
	run_wizard "$@"
}
main "$@"
