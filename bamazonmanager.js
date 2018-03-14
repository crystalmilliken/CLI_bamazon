var mysql = require('mysql');
var inquirer = require('inquirer');
var colors = require('colors');

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bamazon"
})
connection.connect(function () {
    start();
}
)
function start() {
    const departmentNames = [];
    connection.query('SELECT department_name FROM departments', (err, res) => {
        for (let i = 0; i < res.length; i++) {
            departmentNames.push(res[i].department_name);
        }
    });
    inquirer.prompt([
        {
            type: "list",
            name: "choice",
            choices: [`View Products for Sale`, `View Low Inventory`, `Add to Inventory`, `Add New Product`, 'View Sales Totals'],
            message: "What would you like to do?"
        }
    ]).then(function (res) {

        switch (res.choice) {
            case `View Products for Sale`:
                viewProductsSale();
                break;
            case `View Low Inventory`:
                viewLowInventory();
                break;
            case `Add to Inventory`:
                getList();
                break;
            case `Add New Product`:
                addNewProduct(departmentNames);
                break;
            case 'View Sales Totals':
                viewSalesTotals();
                break;
            default:
                start();
        }
    })
}
function getList() {
    connection.query('SELECT * FROM products', (err, res) => {
        chooseItemToUpdate(res)
    });
}
function viewProductsSale() {
    connection.query('SELECT * FROM products', (err, res) => {
        res.map((x) => {
            console.log(`
            Item Id: ${x.item_id},
            Product Name: ${x.product_name}, 
            Department: ${x.department_name}, 
            Price: ${x.price}, 
            Stock Quantity: ${x.stock_quantity}, 
            Product Sales: ${x.product_sales}
            ----------------------------------------`.green)
        });
        start();
    });

}
function viewLowInventory() {
    connection.query('SELECT * FROM products WHERE stock_quantity < 5', (err, res) => {
        res.map((x) => {
            console.log(`
            Item Id: ${x.item_id},
            Product Name: ${x.product_name}, 
            Department: ${x.department_name}, 
            Price: ${x.price}, 
            Stock Quantity: ${x.stock_quantity}, 
            Product Sales: ${x.product_sales}
            ----------------------------------------`.green)
        });
        start();
    });
}
function chooseItemToUpdate(list) {
    const itemList = [];
    let id;
    for (let i = 0; i < list.length; i++) {
        let item = `ID: ${list[i].item_id} Name: ${list[i].product_name}`
        itemList.push(item);
    }
    inquirer.prompt([
        {
            type: "list",
            name: "choice",
            message: "What item would you like to add more of?",
            choices: itemList
        },
        {
            type: "input",
            name: "amountToAdd",
            message: "How many items would you like to add to the inventory?"
        }
    ]).then(function (res) {
        let choiceId = res.choice;
        var a = choiceId.split("ID: ").pop().split(" Name");
        choiceId = a[0];
        addToInventory(choiceId, res.amountToAdd);

    })
}
function addToInventory(id, amountToAdd) {
    amountToAdd = parseInt(amountToAdd);
    connection.query(`UPDATE products SET stock_quantity = (stock_quantity + ${amountToAdd}) WHERE item_id = ${id}`, function (err, res) {
        console.log(`You added ${amountToAdd}`.green);
        start();
    })
}
function addNewProduct(departmentNames) {
    inquirer.prompt([
        {
            type: "input",
            name: "productN",
            message: "Product Name?"
        },
        {
            type: "list",
            name: "departmentN",
            message: "Department?",
            choices: departmentNames
        },
        {
            type: "input",
            name: "price",
            message: "Price?"
        },
        {
            type: "input",
            name: "stock",
            message: "Stock Quantity?"
        },

    ]).then(function (res) {

        connection.query('INSERT INTO products SET ?',
            {
                product_name: res.productN,
                department_name: res.departmentN,
                price: res.price,
                stock_quantity: res.stock,
                product_sales: 0.00
            }, function (err, res) {
                console.log("You added a new product!".red);
                start();
            })
    })

}
function viewSalesTotals() {
    connection.query(`SELECT * FROM products WHERE product_sales > 0`, function (err, res) {
        let totalSales = 0;
        for (let i = 0; i < res.length; i++) {
            let prodSale = res[i].product_sales.toFixed(2);
            console.log(`${res[i].product_name}: $${prodSale}`);
            totalSales += res[i].product_sales;

        }
        console.log(`Total Sales: $${totalSales}`.red);
        start();
    })
}
