// SELECT category, COUNT(*) as total_sales
// FROM purchase_record
// JOIN product ON purchase_record.product_id = product.product_id
// JOIN user ON purchase_record.buyer_id = user.user_id
// WHERE user.name = 'John Doe' -- replace with the name of the user who owned the products
// GROUP BY category
// HAVING total_sales > 2;

// write this query in mongodb
// Here is the equivalent query in MongoDB using the aggregation pipeline:

db.purchase_record.aggregate([
  {
    $lookup: {
      from: "product",
      localField: "product_id",
      foreignField: "product_id",
      as: "product"
    }
  },
  {
    $lookup: {
      from: "user",
      localField: "buyer_id",
      foreignField: "user_id",
      as: "user"
    }
  },
  {
    $unwind: "$product"
  },
  {
    $unwind: "$user"
  },
  {
    $match: {
      "user.name": "John Doe"
    }
  },
  {
    $group: {
      _id: "$product.category",
      total_sales: {
        $sum: 1
      }
    }
  },
  {
    $match: {
      total_sales: {
        $gt: 2
      }
    }
  }
])
// In this query, we are using the $lookup stage to join the purchase_record collection with both the product collection and the user collection based on the product_id and buyer_id fields respectively. The $unwind stage is used to flatten the resulting arrays of products and users.

// Next, we use the $match stage to filter the results to only show purchases made by the user with the name "John Doe".

// Then, we group the results by the category field of the product object, and use the $sum operator to count the number of sales for each category.

// Finally, we use the $match stage again to filter the results to only show categories with more than 2 sales.