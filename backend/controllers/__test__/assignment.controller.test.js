/* eslint-env vitest */
const AssignmentController = require("../AssignmentController");

describe("AssignmentController smoke tests", () => {
  it("exports createAssignment function", () => {
    expect(typeof AssignmentController.createAssignment).toBe("function");
  });

  it("exports getAllAssignments function", () => {
    expect(typeof AssignmentController.getAllAssignments).toBe("function");
  });
});
