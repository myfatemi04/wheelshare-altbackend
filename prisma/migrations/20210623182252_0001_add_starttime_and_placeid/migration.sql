/*
  Warnings:

  - Added the required column `placeId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "placeId" TEXT NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;
