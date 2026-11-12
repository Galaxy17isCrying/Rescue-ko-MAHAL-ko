const createCrudRouter = require("../shared/crudFactory");
module.exports = createCrudRouter({
 table: "disaster_warnings",
 fields: ["title", "description", "hazard_type", "severity", "status", "source_name", "source_url", "area_name", "starts_at", "ends_at", "last_updated", "created_by"],
 searchFields: ["title", "description", "area_name"]
});
