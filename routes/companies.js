const express = require("express");
// const db = require("../db");
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
    res.send("help")
});

router.get("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const result = await db.query(
            `SELECT code, name, description 
            FROM companies
            WHERE code = $1`,
            [code]
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

router.post("/", async function (req, res, next) {
    try {
        const { code, name, description } = req.body;
        const result = db.query(
            `INSERT INTO companies
            (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );
        return res.json({
            company: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

router.put("/:code", async function (req, res, next) {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const result = db.query(
            `UPDATE name = $1, description = $2
            FROM companies
            WHERE id = $3
            RETURNING code, name, description`,
            [name, description, id]
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
            WHERE id = $1`,
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