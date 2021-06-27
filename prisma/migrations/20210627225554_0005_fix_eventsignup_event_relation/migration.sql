-- DropForeignKey
ALTER TABLE "EventSignup" DROP CONSTRAINT "EventSignup_userId_fkey";

-- AddForeignKey
ALTER TABLE "EventSignup" ADD FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
