"use strict";

const express = require("express");

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

const router = express.Router();


/** GET / => {companies: [{code, name}, ...]} */

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
        FROM companies`
  );

  const companies = results.rows;
  return res.json({ companies });
});


/** GET / => {company: {code, name, description}} */

router.get("/:code", async function (req, res, next) {
  const { code } = req.params;

  const results = await db.query(
    `SELECT code, name
        FROM companies
        WHERE code = $1`, [code]);

  const company = results.rows[0];
  return res.json({ company });
});

/** POST / {code, name, description} => {company: {code, name, description}} */

router.post("/", async function (req, res, next) {
  console.log("REQ", req, req.body);
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
    [code, name, description]
  );

  const company = result.rows[0];
  return res.json({ company });
});



/** PUT /:code {name, description}=> {company: {code, name, description}} */

router.put("/:code", async function (req, res, next) {
  if (!req.body) throw new BadRequestError();

  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
        SET name=$1,
            description=$2
        WHERE code = $3
        RETURNING code, name, description`,
    [name, description, req.params.code]
  );

  const company = result.rows[0];
  if (!company) throw new NotFoundError(`${req.params.code} not found.`);

  return res.json({ company });
});

/** DELETE /:code returns -> {status: "deleted"} */

router.delete("/:code", async function (req, res, next) {
  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
      RETURNING name`,
    [req.params.code]
  );

  if (!result.rows[0]) throw new NotFoundError(`${req.params.code} not found.`);

  return res.json({ status: "deleted" });
});

module.exports = router;
