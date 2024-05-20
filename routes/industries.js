const express = require("express");
// const db = require("../db");
const slugify = require("slugify");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT i.code AS industry_code, i.industry,
            FROM industries i
            LEFT JOIN company_industries ci ON i.code = ci.industry_code,
            GROUP BY i.code, i.industry`
        );
        return res.json({
            industries: results.rows
        })
    } catch (err) {
        return next(err)
    }
});

router.post('/', async function (req, res, next) {
    try {
        const { industry } = req.body;
        const code = slugify(industry, { lower: true });
        const result = await db.query(
            `INSERT INTO industries
            (code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`,
            [code, industry]
        );
        return res.status(201).json({
            industry: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

router.post('/', async function (req, res, next) {
    try {
        const { company_code, industry_code } = req.body;
        const result = await db.query(
            `INSERT INTO company_industries
            (company_code, industry_code)
            VALUES ($1, $2)
            RETURNING company_code, industry_code`,
            [company_code, industry_code]
        );
        return res.json({
            company_industry: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
});

module.exports = router;