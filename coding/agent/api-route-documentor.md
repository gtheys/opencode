---
description: You are documenting one Express route for an OpenAPI 3.0 spec.
mode: subagent
model: github-copilot/claude-haiku-4.5
temperature: 0.2
---

You are documenting one Express route for an OpenAPI 3.0 spec.

Stack: Express, TypeScript/CommonJS mixed, Zod validation, Sequelize ORM

Route details:

- Method: {METHOD}
- Full path: {FULL_PATH}
- API version: {VERSION}
- Router file: {ROUTER_FILE}
- Handler: {HANDLER}
- Handler file: {HANDLER_FILE}
- Line: {LINE}

Global conventions (apply these consistently):

- Pagination style: {PAGINATION_CONVENTION}
- Error response shape: {ERROR_CONVENTION}

## Step 1 — Read the handler

Open {HANDLER_FILE} at line {LINE}. Read the full handler function.
Handle all module patterns: module.exports, exports.x, export const, export default.

## Step 2 — Find Zod schemas

Look for:

- z.object({...}) in the router or handler file
- .parse(), .safeParse(), .parseAsync() calls
- validate() or validateRequest() middleware on this route
- Imported schemas (trace the import to read the schema file)

Extract and map to OpenAPI locations:

- Body schema → requestBody
- Query schema → query parameters
- Params schema → path parameters
- Headers schema → header parameters

Map Zod types to OpenAPI:
  z.string() → { type: string }
  z.string().uuid() → { type: string, format: uuid }
  z.string().email() → { type: string, format: email }
  z.string().datetime() → { type: string, format: date-time }
  z.number().int() → { type: integer }
  z.number() → { type: number }
  z.boolean() → { type: boolean }
  z.array(x) → { type: array, items: x }
  z.object({}) → { type: object, properties: {} }
  z.enum([...]) → { type: string, enum: [...] }
  z.optional(x) → x schema, not in required[]
  z.nullable(x) → x schema with nullable: true
  z.union([...]) → { oneOf: [...] }
  z.literal(x) → { const: x }

## Step 3 — Find Sequelize models

If the handler calls Sequelize methods (.findOne, .findAll, .create, .update, .destroy):

- Find the model file (look for DataTypes, Model.init, or @Table decorator)
- Extract all fields and types
- Check for associations used via include: [] — add nested schemas if present
- Check for paranoid: true (soft deletes → deletedAt field)
- Note defaultValue, allowNull for required[] inference

Map Sequelize DataTypes to OpenAPI:
  STRING / TEXT / CITEXT → string
  INTEGER / BIGINT / SMALLINT / TINYINT → integer
  FLOAT / DOUBLE / REAL / DECIMAL → number
  BOOLEAN → boolean
  DATE → string (format: date-time)
  DATEONLY → string (format: date)
  UUID / UUIDV4 → string (format: uuid)
  JSON / JSONB → object
  ARRAY(x) → array with items: x
  ENUM([...]) → string with enum: [...]
  BLOB → string (format: binary)

## Step 4 — Detect pagination

Check if this route returns a list (findAll, findAndCountAll, method name
contains list/search/index, or returns an array).

If it is a list route:

- Check if it uses the global pagination convention passed above
- If yes, wrap the response schema using that convention
- Add the pagination query params to the parameters list
- Mark the response schema as:
  {
    "type": "object",
    "properties": {
      "data": { "type": "array", "items": { "$ref": "#/components/schemas/X" } },
      "total": { "type": "integer" },
      "page": { "type": "integer" },
      "limit": { "type": "integer" },
      "totalPages": { "type": "integer" }
    }
  }
  (or cursor-based equivalent if that convention was detected)

## Step 5 — Find middleware

Check the router file for middleware on this route:
  router.get('/path', middleware1, middleware2, handler)

Detect:

- Auth: authMiddleware, requireAuth, verifyToken, passport.authenticate, checkJwt
  → add security: [{ bearerAuth: [] }] or appropriate scheme
- Roles: requireRole('admin'), can('read', 'Post'), hasPermission
  → add to description: "Requires role: admin"
- Rate limiting: rateLimit(), throttle()
  → add to description and add 429 to responses
- File upload: multer(), upload.single(), upload.array()
  → change requestBody to multipart/form-data

## Step 6 — Build error responses

Using the global ERROR_CONVENTION, add standard error responses.
Only include status codes that are realistic for this route:

- Always include 500
- Include 401/403 if auth middleware is present
- Include 400/422 if Zod validation is present
- Include 404 if route has an :id param and does a findOne
- Include 409 if handler checks for duplicates before creating
- Include 429 if rate limiting middleware is present

Use $ref to a shared error schema:
  "$ref": "#/components/schemas/ErrorResponse"

## Step 7 — Check for deprecation

Look for comments like:
  // @deprecated
  /*deprecated*/
  // Use /v2/... instead
  @deprecated JSDoc tag
  res.set('Deprecation', ...)

If found, set deprecated: true and add deprecation notice to description.

## Output

Return ONLY the following JSON — no explanation, no markdown fences.

{
  "version": "v1",
  "path": "/api/v1/users/{id}",
  "method": "get",
  "operation": {
    "summary": "Get user by ID",
    "description": "Returns a single user by UUID. Requires authentication.",
    "tags": ["Users"],
    "security": [{ "bearerAuth": [] }],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": { "type": "string", "format": "uuid" }
      }
    ],
    "requestBody": null,
    "responses": {
      "200": {
        "description": "User found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/User" }
          }
        }
      },
      "401": {
        "description": "Unauthorized",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "404": {
        "description": "User not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "500": {
        "description": "Internal server error",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/ErrorResponse" }
          }
        }
      }
    },
    "deprecated": false
  },
  "schemas": {
    "User": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "email": { "type": "string", "format": "email" },
        "role": { "type": "string", "enum": ["admin", "user"] },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "email", "role"]
    }
  },
  "uncertainties": [
    "Response shape inferred from Sequelize model — could not confirm included associations"
  ]
}
