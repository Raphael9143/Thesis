/* eslint-env vitest */
const ResearcherController = require("../ResearcherController");

describe("ResearcherController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof ResearcherController).toBe("object");
  });
});
