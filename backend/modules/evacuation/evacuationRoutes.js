const createCrudRouter = require("../shared/crudFactory");
module.exports = createCrudRouter({
 table: "evacuation_centers",
 fields: ["name", "address", "barangay", "facilities", "contact_number", "capacity", "current_status", "latitude", "longitude"],
 searchFields: ["name", "address", "barangay"]
});
