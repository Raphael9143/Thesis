/* eslint-env vitest */
const LectureController = require("../LectureController");

describe("LectureController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof LectureController).toBe("object");
  });
});
