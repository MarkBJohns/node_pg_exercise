const express = require("express");
// const db = require("../db");
const slugify = require("slugify");
const router = new express.Router();
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
    // try {
    //     const results = await db.query(
    //         "SELECT * FROM companies"
    //     );
    //     return res.json({
    //         companies: results.rows
    //     });
    // } catch (err) {
    //     return next(err)
    // }
    res.send(
        `I spent a week trying to figure out how to connect to the database and it crashes
        my app when I try to, so these are what the routes should look like if it was connected`
    );
});

router.get("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const cResult = await db.query(
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
            [code]
        );
        if (cResult.rows.length === 0) {
            throw new ExpressError("Company not found", 404)
        }
        const company = cResult.rows[0];
        const invResult = await db.query(
            `SELECT id FROM invoices
            WHERE comp_code = $1`,
            [code]
        );
        company.invoices = invResult.rows;
        const indResult = await db.query(
            `SELECT i.industry
            FROM industries i
            JOIN company_industries ci ON i.code = ci.industry_code
            WHERE ci.company_code = $1`,
            [code]
        );
        company.industries = indResult.rows.map(i => i.industry);
        return res.json({
            company: company
        });
    } catch (err) {
        return next(err)
    }
});

router.post("/", async function (req, res, next) {
    try {
        const { name, description } = req.body;
        const code = slugify(name, { lower: true });
        const result = db.query(
            `INSERT INTO companies
            (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );
        return res.status(201).json({
            company: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

router.put("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const result = db.query(
            `UPDATE name = $1, description = $2
            FROM companies
            WHERE id = $3
            RETURNING code, name, description`,
            [name, description, code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError("Company not found", 404)
        }
        return res.json({
            company: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

router.delete("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const result = await db.query(
            `DELETE FROM companies
            WHERE code = $1
            RETURNING code`,
            [code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError("Company not found", 404)
        }
        return res.json({
            status: "deleted"
        });
    } catch (err) {
        return next(err)
    }
});

module.exports = router;