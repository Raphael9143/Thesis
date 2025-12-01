/* eslint-env vitest */
const TeacherController = require("../TeacherController");

describe("TeacherController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof TeacherController).toBe("object");
  });
});
