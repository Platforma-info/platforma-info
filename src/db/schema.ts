import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const verdictEnum = pgEnum("verdict", [
  "pending",
  "accepted",
  "wrong_answer",
  "runtime_error",
  "timeout",
  "compile_error",
  "internal_error",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 32 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    bio: text("bio").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_username_lower_idx").on(table.username)],
);

export const problems = pgTable(
  "problems",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    statement: text("statement").notNull(),
    difficulty: difficultyEnum("difficulty").default("easy").notNull(),
    tags: text("tags").array().default([]).notNull(),
    timeLimitMs: integer("time_limit_ms").default(5000).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  input: text("input").default("").notNull(),
  expectedOutput: text("expected_output").notNull(),
  isSample: boolean("is_sample").default(false).notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  sourceCode: text("source_code").notNull(),
  verdict: verdictEnum("verdict").default("pending").notNull(),
  testsPassed: integer("tests_passed").default(0).notNull(),
  testsTotal: integer("tests_total").default(0).notNull(),
  message: text("message").default("").notNull(),
  runtimeMs: integer("runtime_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
}));

export const problemsRelations = relations(problems, ({ many }) => ({
  testCases: many(testCases),
  submissions: many(submissions),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  problem: one(problems, { fields: [testCases.problemId], references: [problems.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
}));
