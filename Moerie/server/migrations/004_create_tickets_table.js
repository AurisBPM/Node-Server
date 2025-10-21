/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tickets', function(table) {
    table.integer('id').primary();
    table.integer('report_id').notNullable();
    table.string('status', 45).defaultTo('in_progress');
    table.text('subject');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('gdpr').notNullable().defaultTo(15);
    table.integer('com').notNullable().defaultTo(20);
    table.integer('pro').notNullable().defaultTo(25);
    table.integer('que').notNullable().defaultTo(10);
    table.integer('inf').notNullable().defaultTo(15);
    table.integer('gra').notNullable().defaultTo(5);
    table.integer('inte').notNullable().defaultTo(10);
    table.text('gdprCmnt');
    table.text('comCmnt');
    table.text('proCmnt');
    table.text('queCmnt');
    table.text('infCmnt');
    table.text('graCmnt');
    table.text('inteCmnt');
    table.datetime('updated_at').defaultTo(knex.fn.now());
    table.string('tag', 255);
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
