/* eslint-env vitest */
const ExamController = require("../ExamController");

describe("ExamController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof ExamController).toBe("object");
  });
});
