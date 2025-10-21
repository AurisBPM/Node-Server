/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reports', function(table) {
    table.increments('id').primary();
    table.string('name', 32).notNullable();
    table.bigInteger('agent_id').notNullable();
    table.text('comment');
    table.string('status', 45).defaultTo('in_progress');
    table.string('tag', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now()).notNullable();
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
