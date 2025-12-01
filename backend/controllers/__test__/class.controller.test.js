/* eslint-env vitest */
const ClassController = require("../ClassController");
const Class = require("../../models/Class");
const ClassStudent = require("../../models/ClassStudent");
const { mockResponse } = require("./mockResponse");

describe("ClassController (controllers/__test__)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("createClass - returns 403 if user not teacher", async () => {
    const req = { user: { role: "STUDENT", userId: 10 }, body: {} };
    const res = mockResponse();
    await ClassController.createClass(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("getClassById - returns 403 when student not a member", async () => {
    const foundClass = { id: 10, teacher_id: 5 };
    vi.spyOn(Class, "findByPk").mockResolvedValue(foundClass);
    vi.spyOn(ClassStudent, "findOne").mockResolvedValue(null);
    const req = { params: { id: 10 }, user: { role: "STUDENT", userId: 99 } };
    const res = mockResponse();
    await ClassController.getClassById(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
