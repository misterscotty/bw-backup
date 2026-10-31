#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
package_dir="$root_dir/release/bitwarden-backup"

npm run build

rm -rf "$package_dir"
mkdir -p "$package_dir"

cp -R "$root_dir/dist" "$package_dir/dist"
cp "$root_dir/config.yaml" "$package_dir/config.yaml"
cp "$root_dir/package.json" "$package_dir/package.json"
cp "$root_dir/package-lock.json" "$package_dir/package-lock.json"

(
    cd "$package_dir"
    npm install --omit=dev --ignore-scripts=false
)

cat > "$package_dir/bitwarden-backup" <<'LAUNCHER'
#!/usr/bin/env bash
set -euo pipefail

app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$app_dir"
exec node "$app_dir/dist/main.js" "$@"
LAUNCHER

chmod +x "$package_dir/bitwarden-backup"

echo "Package created at: $package_dir"
echo "Requires: Node.js, Bitwarden CLI (bw), and a working OS keyring."
