/*
  Warnings:

  - Made the column `endTime` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN "joinCode" TEXT;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "startTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "endTime" DATETIME NOT NULL,
    "daysOfWeek" INTEGER NOT NULL,
    "placeId" TEXT NOT NULL,
    "formattedAddress" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("daysOfWeek", "duration", "endTime", "formattedAddress", "groupId", "id", "latitude", "longitude", "name", "placeId", "startTime") SELECT "daysOfWeek", "duration", "endTime", "formattedAddress", "groupId", "id", "latitude", "longitude", "name", "placeId", "startTime" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
