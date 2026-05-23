CREATE OR REPLACE FUNCTION increment_song_play_stats(
  p_song_id uuid,
  p_user_id text,
  p_seconds integer,
  p_increment_play_count boolean DEFAULT false
) RETURNS void AS $$
BEGIN
  -- 1. Increment Global Song Stats
  UPDATE "Songs"
  SET "TotalPlaySeconds" = "TotalPlaySeconds" + p_seconds,
      "PlayCount" = "PlayCount" + (CASE WHEN p_increment_play_count THEN 1 ELSE 0 END)
  WHERE "Id" = p_song_id;

  -- 2. Increment User's Personal Song Stats
  UPDATE "UserSongs"
  SET "TotalPlaySeconds" = "TotalPlaySeconds" + p_seconds,
      "PlayCount" = "PlayCount" + (CASE WHEN p_increment_play_count THEN 1 ELSE 0 END),
      "LastPlayedAt" = NOW()
  WHERE "SongId" = p_song_id AND "UserId" = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Added 2026-05-22 for User Search
CREATE OR REPLACE FUNCTION search_users(search_query text)
RETURNS TABLE (
  "Id" text,
  "DisplayName" text,
  "AvatarUrl" text
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u."Id", u."DisplayName", u."AvatarUrl"
  FROM "Users" u
  WHERE u."DisplayName" ILIKE '%' || search_query || '%'
     OR u."Email" ILIKE '%' || search_query || '%'
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
