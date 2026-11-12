const createCrudRouter = require("../shared/crudFactory");
module.exports = createCrudRouter({
 table: "relief_records",
 fields: ["item_name", "description", "quantity_available", "distribution_location", "distribution_date", "status"],
 searchFields: ["item_name", "description", "distribution_location"]
});
