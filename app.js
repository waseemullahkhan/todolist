//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://waseemullahkhan:test123@cluster0.tlsc1kz.mongodb.net/todolistDB"
);

const itemSchema = { name: String };

const Item = mongoose.model("Item", itemSchema);

const defaultItems = [
  { name: "Buy Food" },
  { name: "Cook Food" },
  { name: "Eat Food" },
];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  Item.find()
    .then(function (items) {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully Default Items Saved");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;
  const item = new Item({ name: itemName });
  if (listTitle === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle })
      .then(function (resultItem) {
        console.log("new Item=" + itemName);
        resultItem.items.push(item);
        resultItem.save();
        res.redirect("/" + listTitle);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem)
      .then(function () {
        console.log("Successfully deleted Item");
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } }
    )
      .then(function (foundList) {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (listItem) {
      console.log(listItem);
      if (!listItem) {
        // Create New List
        const list = new List({ name: customListName, items: defaultItems });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show List
        res.render("list", {
          listTitle: customListName,
          newListItems: listItem.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
