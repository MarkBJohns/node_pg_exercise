const express = require("express");
// const db = require("../db");
const router = new express.Router();
const ExpressError = require("../expressError");

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
        const { comp_code, amt } = req.body;
        const result = await db.query(
            `INSERT INTO invoices
            (comp_code, amt, paid, add_date, paid_date)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );
        return res.status(201).json({
            invoice: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

router.put("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        let paidDate = null;
        
        const currentResult = await db.query(
            `SELECT paid
            FROM invoices
            WHERE id = $1`,
            [id]
        );
        
        if (currentResult.rows.length === 0) {
            throw new ExpressError("Invoice not found", 404);
        }
        
        const currentPaidDate = currentResult.rows[0].paid_date;
        
        if (!currentPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = currentPaidDate;
        }
        
        const result = await db.query(
            `UPDATE invoices
            SET amt = $1, paid = $2, paid_date = $3,
            WHERE id = $4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]
        );
        
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
            WHERE id = $1
            RETURNING id`,
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

module.exports = router;