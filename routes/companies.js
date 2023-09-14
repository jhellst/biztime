const express = require("express");

const db = require("../db");
const { BadRequestError } = require("../expressError");

const router = express.Router();


/** GET / => {companies: [{code, name}, ...]} */

router.get("/", async function(req, res, next) {

  const results = await db.query(
    `SELECT code, name
        FROM companies`
  );

  const companies = results.rows;
  return res.json({ companies });

});


/** GET / => {company: {code, name, description}} */

router.get("/:code", async function(req, res, next) {

  const { code } = req.params;

  const results = await db.query(
    `SELECT code, name
        FROM companies
        WHERE code = $1`, [code]);

  const company = results.rows[0];

  return res.json({ company });

});

/** POST / {code, name, description} => {company: {code, name, description}} */

router.post("/", async function(req, res, next) {
  console.log("REQ",req, req.body);
  if(req.body === undefined) throw new BadRequestError();

  const { code, name, description } = req.body;
  console.log("CODE NAME DES",code, name, description);

  const result = await db.query(
  `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
  [code, name, description]
  );

  const company = result.rows[0];

  return res.json({ company });
});

// /** GET /[name] => {item: {name, price}} */

// router.get("/:name", (req, res, next) => {
//   let foundItem = Item.find(req.params.name);
//   return res.json({ item: foundItem });
// });

// /** PATCH /[name] => {item: {name, price}} */

// router.patch("/:name", (req, res, next) => {
//   if(req.body === undefined){
//     throw new BadRequestError();
//   }
//   let foundItem = Item.update(req.params.name, req.body);
//   return res.json({ item: foundItem });
// });

// /** DELETE /[name] => {message: "Removed"} */

// router.delete("/:name", (req, res, next) => {
//   Item.remove(req.params.name);
//   return res.json({ message: "Deleted" });
// });

module.exports = router;
