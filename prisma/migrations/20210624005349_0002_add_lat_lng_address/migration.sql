/*
  Warnings:

  - Added the required column `formattedAddress` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "formattedAddress" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;
