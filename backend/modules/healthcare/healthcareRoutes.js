const createCrudRouter = require("../shared/crudFactory");
module.exports = createCrudRouter({
 table: "healthcare_facilities",
 fields: ["name", "facility_type", "address", "barangay", "phone", "operating_hours", "latitude", "longitude", "services"],
 searchFields: ["name", "address", "barangay"]
});
