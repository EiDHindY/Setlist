-- Setlist Database Schema
-- Last Updated: 2026-05-04
-- Note: This file tracks the live schema in Supabase. Update it when changes are made.

CREATE TABLE "Users" (
    "Id" text PRIMARY KEY,
    "Email" text NOT NULL,
    "FullName" text NULL,
    "AvatarUrl" text NULL,
    "ExperiencePoints" integer NOT NULL DEFAULT 0,
    "Level" integer NOT NULL DEFAULT 1,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "Bio" text NULL,
    "DisplayName" text NULL,
    "IsPremium" boolean NOT NULL DEFAULT false,
    "LastActiveAt" timestamp with time zone NOT NULL,
    "Location" text NULL,
    "PreferredGenres" text NULL
);

CREATE TABLE "Songs" (
    "Id" uuid PRIMARY KEY,
    "Title" text NOT NULL,
    "Artist" text NOT NULL,
    "Album" text NULL,
    "ISRC" text NULL,
    "BPM" integer NULL,
    "MusicalKey" text NULL,
    "MoodTags" text NULL,
    "Duration" integer NOT NULL,
    "WaveformData" text NULL,
    "PlayCount" integer NOT NULL DEFAULT 0,
    "TotalPlaySeconds" bigint NOT NULL DEFAULT 0,
    "CollectionCount" integer NOT NULL DEFAULT 0,
    "MatchesWon" integer NOT NULL DEFAULT 0,
    "TournamentsWon" integer NOT NULL DEFAULT 0,
    "WinRate" numeric NOT NULL DEFAULT 0,
    "ReleaseDate" timestamp with time zone NULL,
    "BandNotes" text NULL,
    "AlbumArtUrl" text NULL,
    "Url" text NULL,
    "CreatedBy" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "AppleTrackId" text NULL,
    "DeezerTrackId" text NULL,
    
    -- Added: 2026-05-04 for Lyrics Pipeline
    "PlainLyrics" text NULL,
    "SyncedLyrics" text NULL
);

CREATE TABLE "SongVersions" (
    "Id" uuid PRIMARY KEY,
    "SongId" uuid NOT NULL REFERENCES "Songs"("Id"),
    "YouTubeId" text NOT NULL,
    "Title" text NOT NULL,
    "ChannelName" text NULL,
    "ThumbnailUrl" text NULL,
    "Duration" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL,
    "UserId" text NOT NULL REFERENCES "Users"("Id")
);

CREATE TABLE "UserSongs" (
    "UserId" text NOT NULL REFERENCES "Users"("Id"),
    "SongId" uuid NOT NULL REFERENCES "Songs"("Id"),
    "AddedAt" timestamp with time zone NOT NULL,
    "LastPlayedAt" timestamp with time zone NULL,
    "PlayCount" integer NOT NULL DEFAULT 0,
    "TotalPlaySeconds" bigint NOT NULL DEFAULT 0,
    "MatchesWon" integer NOT NULL DEFAULT 0,
    "TournamentsWon" integer NOT NULL DEFAULT 0,
    "WinRate" numeric NOT NULL DEFAULT 0,
    "PersonalNotes" text NULL,
    "UserRating" integer NOT NULL DEFAULT 0,
    "MasteryLevel" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("UserId", "SongId")
);

CREATE TABLE "Folders" (
    "Id" uuid PRIMARY KEY,
    "Name" text NOT NULL,
    "OwnerId" text NOT NULL REFERENCES "Users"("Id"),
    "ParentFolderId" uuid NULL REFERENCES "Folders"("Id"),
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "Setlists" (
    "Id" uuid PRIMARY KEY,
    "Name" text NOT NULL,
    "Description" text NULL,
    "FolderId" uuid NULL REFERENCES "Folders"("Id"),
    "OwnerId" text NOT NULL REFERENCES "Users"("Id"),
    "IsPublic" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "SetlistSongs" (
    "SetlistId" uuid NOT NULL REFERENCES "Setlists"("Id"),
    "SongId" uuid NOT NULL REFERENCES "Songs"("Id"),
    "Position" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL,
    PRIMARY KEY ("SetlistId", "SongId")
);

CREATE TABLE "Credits" (
    "Id" uuid PRIMARY KEY,
    "SongId" uuid NOT NULL REFERENCES "Songs"("Id"),
    "Role" text NOT NULL,
    "Name" text NOT NULL
);

CREATE TABLE "__EFMigrationsHistory" (
    "MigrationId" character varying PRIMARY KEY,
    "ProductVersion" character varying NOT NULL
);

CREATE TABLE "Friendships" (
    "UserId1" text NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "UserId2" text NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Status" text NOT NULL CHECK ("Status" IN ('pending', 'accepted', 'blocked')),
    "ActionUserId" text NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_friendships PRIMARY KEY ("UserId1", "UserId2"),
    CONSTRAINT chk_friendships_order CHECK ("UserId1" < "UserId2")
);

CREATE INDEX idx_friendships_users ON "Friendships" ("UserId1", "UserId2", "Status");

ALTER TABLE "Friendships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
    ON "Friendships" FOR SELECT
    USING (auth.uid()::text = "UserId1" OR auth.uid()::text = "UserId2");

CREATE POLICY "Users can insert friendships they are part of"
    ON "Friendships" FOR INSERT
    WITH CHECK (auth.uid()::text = "UserId1" OR auth.uid()::text = "UserId2");

CREATE POLICY "Users can update their own friendships"
    ON "Friendships" FOR UPDATE
    USING (auth.uid()::text = "UserId1" OR auth.uid()::text = "UserId2");

CREATE POLICY "Users can delete their own friendships"
    ON "Friendships" FOR DELETE
    USING (auth.uid()::text = "UserId1" OR auth.uid()::text = "UserId2");
