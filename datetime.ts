// in milliseconds
const day = 86_400_000;

export function calculateSingleEventEndTime(startTime: Date, duration: number) {
  return new Date(startTime.getTime() + duration * 60_000);
}

/**
 * Returns null for a date with no end time
 * Returns the datetime of the last moment of the event
 */
export function calculateRecurringEventEndTime(
  startTime: Date,
  duration: number,
  endDate: Date | null
) {
  if (endDate === null) {
    return null;
  }

  let endTime = new Date(startTime.getTime() + duration * 60_000);
  while (endTime.getTime() < endDate.getTime()) {
    // increment by one day
    endTime = new Date(endTime.getTime() + day); //.setTime(endTime.getTime() + day);
  }

  //           duration
  //      <---------------->
  //  |   *            |   *           |               |   * <-- final end time
  // ---- startTime ------ firstEndTime -------------- endDate -----

  return endTime;
}
