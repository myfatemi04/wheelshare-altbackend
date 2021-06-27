/*
  Warnings:

  - You are about to drop the column `type` on the `EventSignup` table. All the data in the column will be lost.
  - Added the required column `formattedAddress` to the `EventSignup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `EventSignup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `EventSignup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `placeId` to the `EventSignup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventSignup" DROP COLUMN "type",
ADD COLUMN     "formattedAddress" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "placeId" TEXT NOT NULL;
