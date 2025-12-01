/* eslint-env vitest */
const SubmissionController = require("../SubmissionController");

describe("SubmissionController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof SubmissionController).toBe("object");
  });
});
