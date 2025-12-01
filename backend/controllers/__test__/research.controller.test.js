/* eslint-env vitest */
const ResearchController = require("../ResearchController");

describe("ResearchController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof ResearchController).toBe("object");
  });
});
