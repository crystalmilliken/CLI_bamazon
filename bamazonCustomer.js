var mysql = require('mysql');
var inquirer = require('inquirer');
var colors = require('colors');

// Created a class and instance because of needing promises to get data back and populate, later did it a little differently
class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}
let bamazon = new Database({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bamazon"
});

// Begin application
start();

// Pulls data in
function start() {

    bamazon.query('SELECT * FROM products').then(rows => {
        chooseQuestions(rows);
    })
}

// Brings data in, creates array to be used in inquirer
function chooseQuestions(rows) {
    let listOfIds = [];
    for (let i = 0; i < rows.length; i++) {
        listOfIds.push(rows[i].item_id.toString());
        console.log(`Id: ${rows[i].item_id}, Item Name: ${rows[i].product_name}, Price: ${rows[i].price}`);
    }
    inquirer.prompt([
        {
            type: "list",
            name: "choice",
            message: "Which product would you like to purchase?",
            choices: listOfIds
        },
        {
            type: "input",
            name: "amount",
            message: "How many would you like to purchase?"
        }]).then(function (res) {
            purchaseProduct(res.choice, res.amount);
        })

}

// Takes in chosen product and the amount to be purchased
function purchaseProduct(choice, amount) {
    choice = parseInt(choice);
    amount = parseInt(amount);

    bamazon.query(`SELECT * FROM products WHERE item_id = ${choice}`).then(rows => {
        let currentPurchaseTotal = rows[0].product_sales;

        if (rows[0].stock_quantity >= amount) {
            let stockLeft = (rows[0].stock_quantity - amount);
            let cost = (rows[0].price * amount)
            calculateTransaction(rows[0].product_name, choice, stockLeft, cost, currentPurchaseTotal)
        } else {
            console.log("Im sorry, there is not enough left in stock, please try again!".green);
            start();
        }
    })
}

// Calculates total, updates stock and product sales
function calculateTransaction(item, choice, stockLeft, cost, currentPurchaseTotal) {
    bamazon.query(`Update products SET ? WHERE item_id = ${choice}`,
        {
            stock_quantity: stockLeft,
            product_sales: cost + currentPurchaseTotal
        }
    ).then(rows => {
        cost = cost.toFixed(2);
        console.log(`You successfully purchased ${item}(s) for ${cost}`.red);
        start();
    })
}