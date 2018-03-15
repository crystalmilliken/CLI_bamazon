var mysql = require('mysql');
var inquirer = require('inquirer');
var colors = require('colors');
const cTable = require('console.table');

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bamazon"
});
connection.connect(function () {
    start();
});

// Begins application
function start() {
    inquirer.prompt([
        {
            type: "list",
            name: "choice",
            message: "What would you like to do?",
            choices: ["View Product Sales by Department", "Create New Department", "Log out"]
        }
    ]).then(function (res) {
        if (res.choice === "View Product Sales by Department") {
            viewProductSales();
        } else if (res.choice === "Create New Department") {
            createNewDepartment();
        } else {
            connection.end();
            process.exit();
        }
    })
}

// Gets all products for sale and department profit
function viewProductSales() {
    connection.query(`
    SELECT departments.department_id, departments.department_name, departments.over_head_costs, 
    SUM(products.product_sales) AS total   
    FROM products 
    INNER JOIN departments 
    ON products.department_name = departments.department_name
    GROUP BY departments.department_name`, function (err, res) {
            if (err) throw err;
            let tableInfo = [];
            for (let i = 0; i < res.length; i++) {
                let prodSales;
                if (res[i].product_sales === null) {
                    prodSales = 0.00;
                } else {
                    prodSales = parseFloat(res[i].total)
                    prodSales = prodSales.toFixed(2)
                }
                let overHead = parseFloat(res[i].over_head_costs);
                overHead = overHead.toFixed(2);
                let totalProf = prodSales - overHead;
                totalProf = totalProf.toFixed(2);
                tableInfo.push({
                    department_id: `${res[i].department_id}`.green,
                    department_name: `${res[i].department_name}`.blue,
                    over_head_costs: `${res[i].over_head_costs}`.green,
                    product_sales: `$${prodSales}`.blue,
                    total_profit: `$${totalProf}`.green
                })

            }
            console.table(tableInfo);
            start();
        })
}

// Creates a new department
function createNewDepartment() {
    inquirer.prompt([
        {
            type: "input",
            name: "department_n",
            message: "Department Name?"
        },
        {
            type: "input",
            name: "overhead",
            message: "What's the over head cost for the department?"
        }
    ]).then((res) => {
        connection.query(`INSERT INTO departments SET ?`, [{
            department_name: res.department_n,
            over_head_costs: res.overhead
        }], (err, result) => {
            if (err) throw err;
            console.log(`You created a new department named ${res.department_n}`);
            start();
        })
    })

}