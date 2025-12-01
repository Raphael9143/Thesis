/* eslint-env vitest */
const GroupController = require("../GroupController");

describe("GroupController smoke tests", () => {
  it("exports methods", () => {
    expect(typeof GroupController).toBe("object");
  });
});
