#!/bin/bash
set -e

# Source files
VIP_MASTER="vip_icon_master.png"
STANDARD_MASTER="standard_icon_master.png"
VIP_FG="vip_foreground_final.png"
STANDARD_FG="standard_foreground_final.png"

# Target directories
BASE_VIP="android/app/src/vip/res"
BASE_STANDARD="android/app/src/playstore/res"

# Densities and sizes (Legacy, Adaptive)
declare -A SIZES=( ["mdpi"]="48,108" ["hdpi"]="72,162" ["xhdpi"]="96,216" ["xxhdpi"]="144,324" ["xxxhdpi"]="192,432" )

deploy_flavor() {
  local flavor=$1
  local master=$2
  local fg=$3
  local target_base=$4

  echo "Deploying $flavor icons..."
  for den in "${!SIZES[@]}"; do
    IFS=',' read -r legacy adaptive <<< "${SIZES[$den]}"
    
    # Legacy Square Icon
    mkdir -p "$target_base/mipmap-$den"
    magick "$master" -resize "${legacy}x${legacy}" "$target_base/mipmap-$den/ic_launcher.png"
    magick "$master" -resize "${legacy}x${legacy}" "$target_base/mipmap-$den/launcher_icon.png"
    
    # Round Icon (already a circle in our master, but we resize it)
    magick "$master" -resize "${legacy}x${legacy}" "$target_base/mipmap-$den/ic_launcher_round.png"
    
    # Adaptive Foreground
    mkdir -p "$target_base/drawable-$den"
    magick "$fg" -resize "${adaptive}x${adaptive}" "$target_base/drawable-$den/ic_launcher_foreground.png"
  done
}

deploy_flavor "VIP" "$VIP_MASTER" "$VIP_FG" "$BASE_VIP"
deploy_flavor "Standard" "$STANDARD_MASTER" "$STANDARD_FG" "$BASE_STANDARD"

echo "Done! Icons manually forced into flavor folders."
