-- Run this in your Supabase SQL Editor to add support for nested folders
ALTER TABLE "Folders" 
ADD COLUMN "ParentFolderId" uuid NULL REFERENCES "Folders"("Id");
