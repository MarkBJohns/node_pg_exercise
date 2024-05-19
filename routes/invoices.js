const express = require("express");
// const db = require("../db");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

router.get("/", async function (req, res, next) {
    try {
        const results = db.query(
            `SELECT * FROM invoices`
        );
        return res.json(results.rows)
    } catch (err) {
        return next(err)
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const iResult = await db.query(
            `SELECT *
            FROM invoices
            WHERE id = $1`,
            [id]
        );
        if (iResult.rows.length === 0) {
            throw new ExpressError("Invoice not found")
        }
        const invoice = iResult.rows[0]
        const cResult = await db.query(
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
            [invoice.comp_code]
        );
        invoice.company = cResult.rows;
        delete invoice.comp_code;
        return res.json({
            invoice
        });
    } catch (err) {
        return next(err)
    }
});

router.post("/", async function (req, res, next) {
    try {
        const { comp_code, amt, paid, add_date, paid_date } = req.body;
        const result = await db.query(
            `INSERT INTO invoices
            (comp_code, amt, paid, add_date, paid_date)
            VALUES ($1, $2, $3, $4, $5)`,
            [comp_code, amt, paid, add_date, paid_date]
        );
        return res.json({
            invoice: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

router.put("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const result = await db.query(
            `UPDATE amt = $1
            FROM invoices
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError("Invoice not found", 404)
        }
        return res.json({
            invoice: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const result = await db.query(
            `DELETE FROM invoices
            WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError("Invoice not found", 404)
        }
        return res.json({
            status: "deleted"
        });
    } catch (err) {
        return next(err)
    }
});

router("/companies/:code", async function (req, res, next) {
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
        const iResult = await db.query(
            `SELECT * FROM invoices
            WHERE comp_code = $1`,
            [company.code]
        );
        company.invoices = iResult.rows;
        return res.json({
            company
        });
    } catch (err) {
        return next(err)
    }
});

module.exports = router;