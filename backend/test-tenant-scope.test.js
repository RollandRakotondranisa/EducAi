const test = require("node:test");
const assert = require("node:assert/strict");
const { tenantContext, installTenantScopes, tenantModelNames } = require("./src/utils/tenant-context");

function buildModels() {
  return Object.fromEntries(tenantModelNames.map((name) => {
    const hooks = new Map();
    return [name, {
      rawAttributes: { id: {} },
      hooks,
      refreshAttributes() {},
      addHook(hookName, _key, callback) {
        hooks.set(hookName, callback);
      },
    }];
  }));
}

function tenantCondition(where) {
  const andKey = Object.getOwnPropertySymbols(where).find((key) => String(key).includes("and"));
  return andKey ? where[andKey].find((part) => part.organizationId !== undefined) : undefined;
}

test("les lectures, comptages et écritures sont limitées à l'établissement courant", () => {
  const models = buildModels();
  installTenantScopes(models);
  const course = models.Course;

  tenantContext.run({ organizationId: 23, isSuperAdmin: false }, () => {
    const findOptions = { where: { id: 5 } };
    course.hooks.get("beforeFind")(findOptions);
    const where = findOptions.where[Object.getOwnPropertySymbols(findOptions.where)[0]];
    assert.deepEqual(where, [{ id: 5 }, { organizationId: 23 }]);

    const countOptions = { where: { code: "BIO" } };
    course.hooks.get("beforeCount")(countOptions);
    assert.deepEqual(tenantCondition(countOptions.where), { organizationId: 23 });

    const includeOptions = {
      model: models.User,
      include: [{ model: models.CourseStudent }],
      through: { model: models.CourseStudent },
    };
    course.hooks.get("beforeFind")({ include: [includeOptions] });
    assert.deepEqual(tenantCondition(includeOptions.where), { organizationId: 23 });
    assert.deepEqual(tenantCondition(includeOptions.include[0].where), { organizationId: 23 });
    assert.deepEqual(tenantCondition(includeOptions.through.where), { organizationId: 23 });
    assert.equal(includeOptions.required, false);
    assert.equal(includeOptions.include[0].required, false);

    const requiredInclude = { model: models.User, required: true };
    course.hooks.get("beforeFind")({ include: [requiredInclude] });
    assert.equal(requiredInclude.required, true);

    const instance = { organizationId: 999 };
    course.hooks.get("beforeCreate")(instance);
    assert.equal(instance.organizationId, 23);

    const bulkOptions = { where: { id: 5 }, attributes: { name: "Cours" } };
    course.hooks.get("beforeBulkUpdate")(bulkOptions);
    assert.equal(bulkOptions.attributes.organizationId, 23);

    const destroyOptions = { where: { id: 5 } };
    course.hooks.get("beforeBulkDestroy")(destroyOptions);
    assert.deepEqual(tenantCondition(destroyOptions.where), { organizationId: 23 });
  });
});

test("le super-admin peut consulter toutes les organisations sans écraser leur rattachement", () => {
  const models = buildModels();
  installTenantScopes(models);
  const course = models.Course;

  tenantContext.run({ organizationId: null, isSuperAdmin: true }, () => {
    const options = { where: { id: 9 } };
    course.hooks.get("beforeFind")(options);
    assert.deepEqual(options.where, { id: 9 });

    const instance = { organizationId: 4 };
    course.hooks.get("beforeCreate")(instance);
    assert.equal(instance.organizationId, 4);
  });
});

test("une session non-super-admin sans établissement est refusée", () => {
  const models = buildModels();
  installTenantScopes(models);
  assert.throws(() => tenantContext.run({ organizationId: null, isSuperAdmin: false }, () => {
    models.User.hooks.get("beforeFind")({});
  }), { statusCode: 403 });
});
