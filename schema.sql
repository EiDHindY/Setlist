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
