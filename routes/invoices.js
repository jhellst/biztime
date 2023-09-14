"use strict";

const express = require("express");

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

const router = express.Router();



/** GET / => {invoices: [{id, comp_code}, ...]} */

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices
        ORDER BY comp_code`
  );
  const invoices = results.rows;

  return res.json({ invoices });
});



/** GET / => {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */

router.get("/:id", async function (req, res, next) {
  const { id } = req.params;

  const invoiceResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
        FROM invoices
        WHERE id=$1`,
    [id]
  );

  const invoice = invoiceResults.rows[0];
  if (!invoice) throw new NotFoundError(`Invoice of id ${id} not found.`);

  const comp_code = invoice.comp_code;

  const companiesResults = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
    [comp_code]
  );
  const company = companiesResults.rows[0];
  invoice.company = company;

  return res.json({ invoice });
});



/** POST / {comp_code, amt} => {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */

router.post("/", async function (req, res, next) {
  if (!req.body) throw new BadRequestError();

  const { comp_code, amt } = req.body;

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );
  const invoice = result.rows[0];

  return res.json({ invoice });
});


/** PUT /:id {amt} => {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */

router.put("/:id", async function (req, res, next) {

  if (!req.body) throw new BadRequestError();

  const { amt } = req.body;
  if (!amt) throw new BadRequestError("Amount not provided for invoicing.");

  const { id } = req.params;

  const result = await db.query(
    `UPDATE invoices
        SET amt = $1
        WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]);
  const invoice = result.rows[0];

  if (!invoice) throw new NotFoundError(`Invoice of id ${id} not found.`);

  return res.json({ invoice });
});



/** DELETE /:id returns -> {status: "deleted"} */

router.delete("/:id", async function (req, res, next) {
  const { id } = req.params;

  const result = await db.query(
    `DELETE FROM invoices WHERE id = $1
        RETURNING id`,
    [id]
  );

  if (!result.rows[0]) throw new NotFoundError(`${req.params.id} not found.`);

  return res.json({ status: "deleted" });
});


module.exports = router;