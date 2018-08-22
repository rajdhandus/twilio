const express = require("express");
const bodyParser = require("body-parser");
const config = require("./config");
const os = require("os");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const request = require("request");
const router = express.Router();
const trivialdb = require("trivialdb");

// Create a namespace
const ns1 = trivialdb.ns("test-ns");

// Create a namespace with some options
const ns2 = trivialdb.ns("test-ns", { dbPath: "server/db" });

// Create a database inside that namespace
const db = ns1.db("test", { writeToDisk: false });

//-------------------------------------
//
// Automatically parse request body as JSON
//
//-------------------------------------
router.use(bodyParser.json());

//-------------------------------------
//
// Set Content-Type for all responses for these routes
//
//-------------------------------------
router.use((req, res, next) => {
  res.set("Content-Type", "application/json");
  next();
});

//-------------------------------------
//
// Routes
//
//-------------------------------------
router.get("/", function(req, res, next) {
  res.status(200).json({ hello: "world" });
});

let inventory = [];
let inventoryStr = "";

request("http://localhost:3001/api/items", function(error, urlResponse, body) {
  inventory = JSON.parse(body);
  inventoryStr = body;
});

const orders = [];

router.post("/", function(req, res, next) {
  console.log(req.body);
  const response = new MessagingResponse();
  console.log(req.body.Body);

  if (req.body.Body === "Hello") {
    response.message("Welcome to PopUp!");
    response.message("Menu");
    response.message("Type 1 for Inventory");
    response.message("Type 2 <ItemName> <ItemQty> for Add to Cart");
    response.message("Type 3 Checkout");
    response.message("Type 4 Promotions");
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(response.toString());
  } else if (req.body.Body === "1") {
    for (var i = 0; i < inventory.length; i++) {
      response.message("Item Name : " + inventory[i].name);
      response.message("Item Price : " + inventory[i].price);
      response.message("Item Image : " + inventory[i].photoURL);
    }
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(response.toString());
  } else if (
    // inventoryStr.includes(req.body.Body) ||
    req.body.Body.includes("2")
  ) {
    for (var i = 0; i < inventory.length; i++) {
      console.log(req.body.Body.split(" ")[1]);
      console.log(inventory[i].name);
      if (inventory[i].name === req.body.Body.split(" ")[1]) {
        console.log("Item Found");
        response.message("Item Name : " + inventory[i].name);
        response.message("Item Price : " + inventory[i].price);
        response.message("Requested Quantity : " + req.body.Body.split(" ")[2]);
        let lineItemPrice =
          parseFloat(req.body.Body.split(" ")[2]) *
          parseFloat(inventory[i].price);
        response.message("Line Item Price : " + lineItemPrice);
        // const itemsAdded = [];
        const itemsAdded = db.get(req.body.From) || [];
        const newItem = {
          name: inventory[i].name,
          price: inventory[i].price,
          qty: req.body.Body.split(" ")[2],
          linePrice: lineItemPrice
        };
        itemsAdded.push(newItem);

        db.set(req.body.From, itemsAdded);

        console.log("Getting from DB ");
        console.log(db.get(req.body.From));

        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(response.toString());
      }
    }
    // response.message(
    //   "We don't have " + req.body.Body + " in stock right now. "
    // );
    // res.writeHead(200, { "Content-Type": "text/xml" });
    // res.end(response.toString());
  } else if (req.body.Body === "3") {
    console.log(req.body.From + " would like to checkout the items in cart");
    console.log(db.get(req.body.From));
    const itemsForCheckout = db.get(req.body.From);

    let orderTotal = 0.0;
    for (var i = 0; i < itemsForCheckout.length; i++) {
      response.message(
        itemsForCheckout[i].qty + " order of " + itemsForCheckout[i].name
      );
      orderTotal += itemsForCheckout[i].linePrice;
    }
    response.message("Total Price : " + orderTotal);
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(response.toString());
  } else if (req.body.Body === "4") {
    response.message("TODAY ONLY !!! Buy one get one..");
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(response.toString());
  } else {
    response.message("Goddammmmmmit.. I can't understand a thing you said..");
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(response.toString());
  }

  console.log(response.toString());
});

router.get("/api", function(req, res, next) {
  const remoteAddress = req.connection.remoteAddress;
  const hostName = os.hostname();
  res.status(200).json({ remoteAddress, hostName });
});

module.exports = router;
