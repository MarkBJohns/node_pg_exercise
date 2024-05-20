process.env.NODE_ENV = 'test';

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const router = require("./companies");

let testInvoice;

beforeEach(async function () {
    const result = await db.query(
        `INSERT INTO invoices
        (comp_code, amt, paid, add_date, paid_date)
        VALUES ($1, $2, $3, $4, $5)`,
        ['ibm', 100, true, '2024-05-20', '2024-05-20']
    );
    testInvoice = result.rows[0];
});

afterEach(async function () {
    await db.query(`DELETE FROM invoices`);
});

afterAll(async function () {
    await db.end();
});

describe("GET /invoices", function () {
    test("show all invoices", async function () {
        const result = await request(app).get("/invoices");
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual({
            invoices =[testInvoice]
        });
    });
});

describe("GET /invoices/:id", function () {
    test("show a single invoice", async function () {
        const result = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual({
            invoice: testInvoice
        });
    });
    test("return a 404 if invalid id", async function () {
        const result = await request(app).get('/invoices/0');
        expect(result.statusCode).toEqual(404);
    });
});

describe("POST /invoices", function () {
    test("create a new invoice", async function () {
        const result = await request(app).post('/invoices')
            .send({ comp_code: 'ibm', amt: 200 });
        expect(result.statusCode).toEqual(201);
        expect(result.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: 'ibm',
                amt: 200,
                paid: false,
                add_date: expect.any(Date),
                paid_date: null
            }
        });
    });
});

describe("PUT /invoices/:id", function () {
    test("pay toward an existing invoice", async function () {
        const result = await request(app).put(`/invoices/${testInvoice.id}`)
            .send({ amt: 50, paid: false });
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: testInvoice.comp_code,
                amt: 50,
                paid: false,
                add_date: expect.any(Date),
                paid_date: null
            }
        });
    });
    test("paying off an existing invoice", async function () {
        const result = await request(app).put(`/invoices/${testInvoice.id}`)
            .send({ amt: testInvoice.amt, paid: true });
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: testInvoice.comp_code,
                amt: testInvoice.amt,
                paid: true,
                add_date: expect.any(Date),
                paid_date: expect.any(Date)
            }
        });
    });
    test("return a 404 for invalid id", async function () {
        const result = await request(app).put('/invoices/0')
            .send({ amt: 0, paid: false });
        expect(result.statusCode).toEqual(404);
    });
});

expect("DELETE /invoices/:id", function () {
    test("deleting an invoice by id", async function () {
        const result = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual({
            status: "deleted"
        });
    });
    test("return a 404 for invalid id", async function () {
        const result = await request(app).delete('/invoices/0');
        expect(result.statusCode).toEqual(404);
    });
});