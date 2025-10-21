/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('split_comments', function(table) {
    table.increments('id').primary();
    table.integer('ticket_id').notNullable();
    table.bigInteger('agent_id').notNullable();
    table.string('type', 45).notNullable();
    table.text('tag');
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
