const { AsyncLocalStorage } = require("node:async_hooks");
const { Op, DataTypes } = require("sequelize");

const tenantContext = new AsyncLocalStorage();
const tenantModelNames = [
  "User",
  "UserRequest",
  "Course",
  "CourseStudent",
  "Audit",
  "Document",
  "DocumentHistory",
  "Exam",
  "ExamQuestion",
  "ExamAttempt",
  "ExamAnswer",
  "ExamResult",
  "Message",
  "MessageAttachment",
  "Announcement",
  "AnnouncementAttachment",
  "AcademicYear",
  "AcademicProgram",
  "AcademicLevel",
  "AcademicClass",
  "AcademicClassTeacher",
];

function addTenantCondition(options, model, tenant) {
  if (!model.rawAttributes.organizationId || !tenant || tenant.isSuperAdmin) return;
  if (!tenant.organizationId) {
    const error = new Error("Ce compte n'est rattaché à aucun établissement.");
    error.statusCode = 403;
    throw error;
  }

  options.where = {
    [Op.and]: [
      options.where || {},
      { organizationId: tenant.organizationId },
    ],
  };
}

function scopeIncludes(includes, tenant) {
  for (const include of includes || []) {
    if (!include || typeof include !== "object") continue;
    if (include.model) {
      addTenantCondition(include, include.model, tenant);
      if (tenant && !tenant.isSuperAdmin && include.model.rawAttributes.organizationId && include.required === undefined) {
        include.required = false;
      }
    }
    if (include.through?.model) addTenantCondition(include.through, include.through.model, tenant);
    scopeIncludes(include.include, tenant);
  }
}

function installTenantScopes(models) {
  for (const name of tenantModelNames) {
    const model = models[name];
    if (!model) throw new Error(`Modèle tenant manquant : ${name}`);
    if (!model.rawAttributes.organizationId) {
      model.rawAttributes.organizationId = {
        type: DataTypes.INTEGER,
        allowNull: true,
      };
      model.refreshAttributes();
    }

    model.addHook("beforeFind", `tenant-before-find-${name}`, (options) => {
      const tenant = tenantContext.getStore();
      addTenantCondition(options, model, tenant);
      scopeIncludes(options.include, tenant);
    });
    model.addHook("beforeCount", `tenant-before-count-${name}`, (options) => {
      addTenantCondition(options, model, tenantContext.getStore());
      scopeIncludes(options.include, tenantContext.getStore());
    });
    model.addHook("beforeBulkUpdate", `tenant-before-update-${name}`, (options) => {
      const tenant = tenantContext.getStore();
      addTenantCondition(options, model, tenant);
      if (tenant && !tenant.isSuperAdmin && options.attributes) {
        options.attributes.organizationId = tenant.organizationId;
      }
    });
    model.addHook("beforeBulkDestroy", `tenant-before-destroy-${name}`, (options) => {
      addTenantCondition(options, model, tenantContext.getStore());
    });
    model.addHook("beforeCreate", `tenant-before-create-${name}`, (instance) => {
      const tenant = tenantContext.getStore();
      if (tenant && !tenant.isSuperAdmin) instance.organizationId = tenant.organizationId;
    });
    model.addHook("beforeBulkCreate", `tenant-before-bulk-create-${name}`, (instances) => {
      const tenant = tenantContext.getStore();
      if (tenant && !tenant.isSuperAdmin) {
        for (const instance of instances) instance.organizationId = tenant.organizationId;
      }
    });
  }
}

module.exports = { tenantContext, installTenantScopes, tenantModelNames };
