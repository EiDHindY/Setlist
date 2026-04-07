import 'package:flutter/material.dart';
import '../models/song_model.dart';
import '../theme/solarized_theme.dart';

class SongItem extends StatelessWidget {
  final Song song;
  final VoidCallback onTap;
  final bool isPlaying;

  const SongItem({
    super.key,
    required this.song,
    required this.onTap,
    this.isPlaying = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      leading: Container(
        width: 54,
        height: 54,
        decoration: BoxDecoration(
          color: SolarizedTheme.base02,
          borderRadius: BorderRadius.circular(12),
          image: DecorationImage(
            image: NetworkImage(song.albumArt),
            fit: BoxFit.cover,
            onError: (_, __) {},
          ),
          border: isPlaying ? Border.all(color: SolarizedTheme.cyan, width: 2) : null,
        ),
        child: isPlaying 
          ? Container(
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.4),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.pause_rounded, color: SolarizedTheme.base3),
            )
          : null,
      ),
      title: Text(
        song.title,
        style: TextStyle(
          color: isPlaying ? SolarizedTheme.cyan : SolarizedTheme.base2,
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        song.artist,
        style: const TextStyle(color: SolarizedTheme.base01, fontSize: 13),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            song.formattedDuration,
            style: const TextStyle(color: SolarizedTheme.base01, fontSize: 12),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.more_vert_rounded, color: SolarizedTheme.base01),
            onPressed: () {
              // Show more options
            },
          ),
        ],
      ),
    );
  }
}
