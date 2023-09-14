const request = require("supertest");

const app = require("../app");
let db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");

  let results = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ('mcd', 'McDonalds', 'fast food place')
      RETURNING code, name, description`
  );

  testCompany = results.rows[0];
});

afterAll(async function () {
  await db.end();
});


/** GET /companies - returns `{companies: [{code, name}, ...]}` */

describe("GET /companies", function () {
  it("Gets list", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [{
        code: testCompany.code,
        name: testCompany.name
      }]
    });
    expect(resp.statusCode).toEqual(200);
  });
});


/** GET /companies/[code] - return data about one company:
 *  `{company: {code, name, description, invoices: [id, ...]}}` */

describe("GET /companies/:code", function () {
  test("Gets single company", async function () {

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
          VALUES ('mcd', 100)
          RETURNING id, comp_code, amt, paid, add_date, paid_date`
    );
    const invoice = result.rows[0];
    testCompany.invoices = [invoice.id];

    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({ company: testCompany });
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/companies/fake`);
    expect(resp.statusCode).toEqual(404);
  });
});



/** POST /companies - create company from data; return
 *  `{company: {code, name, description}}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send({ code: 'star', name: "Starbucks", description: 'coffee' });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual(
      {
        company: { code: 'star', name: "Starbucks", description: 'coffee' }
      });
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});



/** PUT /companies/[code] - update company;
 * return `{company: {code, name, description}}` */

describe("PUT /companies/:code", function () {
  test("Update single company", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ name: "Troll", description: "TEST" });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: { code: 'mcd', name: "Troll", description: "TEST" },
    });
  });

  test("404 if not found", async function () {
    const resp = await request(app)
      .put(`/companies/fake`)
      .send({ name: "Troll" });
    expect(resp.statusCode).toEqual(404);
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});


/** DELETE /companies/[code] - delete company,
 *  return `{status: "deleted"}` */

describe("DELETE /companies/:code", function () {
  test("Delete single company", async function () {
    const resp = await request(app)
      .delete(`/companies/${testCompany.code}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });

    const resp2 = await request(app).get("/companies");
    expect(resp2.body).toEqual({ companies: [] });
  });
});
