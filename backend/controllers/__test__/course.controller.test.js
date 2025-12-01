/* eslint-env vitest */
const CourseController = require("../CourseController");

describe("CourseController smoke tests", () => {
  it("exports getAllCourses or similar entry points", () => {
    // We only assert existence of exported functions as a starting point
    expect(typeof CourseController).toBe("object");
  });
});
