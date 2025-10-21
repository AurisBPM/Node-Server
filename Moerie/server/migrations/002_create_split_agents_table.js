/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('split_agents', function(table) {
    table.increments('id').primary();
    table.bigInteger('code').notNullable();
    table.string('email', 255).notNullable();
    table.string('tag', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Tables are protected - no rollback allowed
  console.log('Rollback disabled for production safety');
  return Promise.resolve();
};
