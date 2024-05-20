process.env.NODE_ENV = 'test';

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
    const results = await db.query(
        `INSERT INTO companies
        (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
        ['ibm', 'IBM', 'Big blue.']
    );
    testCompany = results.rows[0];
});

afterEach(async function () {
    await db.query(`DELETE FROM companies`);
});

afterAll(async function () {
    await db.end();
});

describe("GET /companies", function () {
    test("shows all of the companies", async function () {
        const response = await request(app).get("/companies");
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [testCompany]
        });
    });
});

describe("GET /companies/:code", function () {
    test("shows a single company", async function () {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: testCompany
        });
    });
    test("returns 404 for invalid code", async function () {
        const response = await request(app).get("/companies/0");
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /companies", function () {
    test("creates a new company", async function () {
        const response = await request(app).post('/companies')
            .send({ code: 'test', name: 'Test', description: 'Test co.' });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: 'test',
                name: 'Test',
                description: 'Test co.'
            }
        });
    });
});

describe("PUT /companies/:code", function () {
    test("Updates a company's data", async function () {
        const response = await request(app).put(`/companies/${testCompany.code}`)
            .send({ code: testCompany.code, name: 'HAL', description: testCompany.description });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: testCompany.code,
                name: 'HAL',
                description: testCompany.description
            }
        });
    });
    test("returns 404 for invalid code", async function () {
        const response = await request(app).put(`/companies/0`)
            .send({ code: 'test', name: 'test', description: 'test' });
        expect(response.statusCode).toEqual(404);
    });
});


describe("DELETE /companies/:code", function () {
    test("Deletes a company by its code", async function () {
        const response = await request(app).delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            status: "deleted"
        });
    });
    test("returns 404 for invalid code", async function () {
        const response = await request(app).delete('/companies/0');
        expect(response.statusCode).toEqual(404);
    });
});