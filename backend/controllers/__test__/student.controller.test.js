/* eslint-env vitest */
const StudentController = require("../StudentController");

describe("StudentController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof StudentController).toBe("object");
  });
});
