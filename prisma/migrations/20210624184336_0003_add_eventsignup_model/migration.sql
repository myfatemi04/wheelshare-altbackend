-- CreateEnum
CREATE TYPE "EventSignupType" AS ENUM ('GOING_CANDRIVE', 'GOING_CANNOTDRIVE', 'INTERESTED', 'NOTGOING');

-- CreateTable
CREATE TABLE "EventSignup" (
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "EventSignupType" NOT NULL DEFAULT E'NOTGOING',

    PRIMARY KEY ("eventId","userId")
);

-- AddForeignKey
ALTER TABLE "EventSignup" ADD FOREIGN KEY ("userId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSignup" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
