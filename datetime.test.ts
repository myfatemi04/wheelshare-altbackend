import {
  calculateRecurringEventEndTime,
  calculateSingleEventEndTime,
} from "./datetime";

describe("datetime", () => {
  it("calculates the end time for a single event", () => {
    const startTime = new Date("2021-02-02");
    const endTime = calculateSingleEventEndTime(startTime, 24 * 60);
    expect(endTime).toStrictEqual(new Date("2021-02-03"));
  });

  it("calculates the end time for a recurring event", () => {
    const startTime = new Date("2021-02-02");
    const duration = 30;
    const endDate = new Date("2021-02-03");
    const endTime = calculateRecurringEventEndTime(
      startTime,
      duration,
      endDate
    );
    expect(endTime.getHours()).toBe(startTime.getHours());
    expect(endTime.getMinutes()).toBe(30);
    expect(endTime.getDate()).toBe(startTime.getDate() + 1);
    expect(endTime.getMonth()).toBe(startTime.getMonth());
    expect(endTime.getFullYear()).toBe(startTime.getFullYear());
  });

  it("calculates the end time for a recurring event", () => {
    const startTime = new Date("2021-02-02T13:35:00");
    const duration = 30;
    const endDate = new Date("2021-02-03");
    const endTime = calculateRecurringEventEndTime(
      startTime,
      duration,
      endDate
    );
    expect(endTime.getHours()).toBe(startTime.getHours() + 1);
    expect(endTime.getMinutes()).toBe(5);
    expect(endTime.getDate()).toBe(startTime.getDate() + 1);
    expect(endTime.getMonth()).toBe(startTime.getMonth());
    expect(endTime.getFullYear()).toBe(startTime.getFullYear());
  });

  it("calculates the end time for a recurring event without an end date", () => {
    const startTime = new Date("2021-02-02");
    const duration = 30;
    const endDate = null;
    const endTime = calculateRecurringEventEndTime(
      startTime,
      duration,
      endDate
    );
    expect(endTime).toStrictEqual(null);
  });
});
