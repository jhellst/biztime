const request = require("supertest");

const app = require("../app");
let db = require("../db");

let testInvoice;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");

  let companyResults = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ('mcd', 'McDonalds', 'fast food place')
      RETURNING code, name, description`
  );

  testCompany = companyResults.rows[0];


  await db.query("DELETE FROM invoices");

  let invoiceResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ('mcd', 9000)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );

  testInvoice = invoiceResults.rows[0];
});

afterAll(async function () {
  await db.end();
});



/** GET /invoices - returns `{invoices: [{id, comp_code}, ...]}` */

describe("GET /invoices", function () {
  it("Gets list", async function () {
    const resp = await request(app).get(`/invoices`);
    expect(resp.body).toEqual({"invoices": [{id: testInvoice.id, comp_code: testInvoice.comp_code}]});
    expect(resp.statusCode).toEqual(200);
  });
});



/** GET /invoices/:id - returns `{invoice: {id, amt, paid, add_date, paid_date,
 *                                company: {code, name, description}}` */

describe("GET /invoices/:id", function () {
  it("Gets single invoice", async function () {
    const resp = await request(app).get(`/invoices/${testInvoice.id}`);

    testInvoice.company = testCompany;

    console.log(resp.body, {"invoice": testInvoice});

    expect(resp.body.invoice.id).toEqual(testInvoice.id);
    expect(resp.body.invoice.amt).toEqual(testInvoice.amt);
    expect(resp.body.invoice.paid).toEqual(testInvoice.paid);
    expect(resp.body.invoice.paid_date).toEqual(testInvoice.paid_date);
    expect(resp.body.invoice.company).toEqual(testInvoice.company);
    expect(resp.statusCode).toEqual(200);
  });
});


/** POST /invoices - create invoice from data; return
 *  `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */

 describe("POST /invoices", function () {
  test("Create new invoice", async function () {
    const resp = await request(app)
      .post(`/invoices`)
      .send({ comp_code: 'mcd', amt: 9999});
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual(
      {
        invoice: {id: expect.any(Number), comp_code: 'mcd', amt: "9999.00", paid: false,
                  add_date: expect.any(String), paid_date: null}
      });
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .post(`/invoices`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});



/** PUT /invoices/[id] - update invoice;
 * return `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */

 describe("PUT /invoices/:id", function () {
  test("Update single invoice", async function () {
    const resp = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 99999});
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(
      {
        invoice: {
          id: expect.any(Number),
          comp_code: testInvoice.comp_code,
          amt: "99999.00",
          paid: false,
          add_date: expect.any(String),
          paid_date: null
        }
      },
    );
  });

  test("404 if not found", async function () {
    const resp = await request(app)
      .put(`/invoices/99999999`)
      .send({ amt: 1234 });
    expect(resp.statusCode).toEqual(404);
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .put(`/invoices/${testCompany.code}`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});



/** DELETE /invoices/[id] - delete invoice,
 *  return `{status: "deleted"}` */

 describe("DELETE /companies/:code", function () {
  test("Delete single invoice", async function () {
    const resp = await request(app)
      .delete(`/invoices/${testInvoice.id}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });

    const resp2 = await request(app).get("/invoices");
    expect(resp2.body).toEqual({ invoices: [] });
  });
});
