# Errors and Warnings

- [Errors and Warnings](#errors-and-warnings)
  - [Overview](#overview)
  - [Rules](#rules)
    - [Problem Details](#problem-details)
    - [Standard Fields](#standard-fields)
    - [Custom Fields](#custom-fields)
    - [Exceptions](#exceptions)
  - [Examples](#examples)
  - [References](#references)

## Overview

In an API application, the following are the most common scenarios when an error
is sent in the response:

- The input parameters when accessing an API Endpoint are invalid
- Business Logic validation fails
- Data Persistence fails
- An external dependency does not respond or fails.
- Any other unanticipated problem resulting in an Internal Server Error (5xx)

Even if the operations are successful it may be useful to issue
warnings to the API consumer. For example the endpoint, entity or field is
deprecated.

The initial information about the success/failure of a request should always be
based on the conformance to the standard HTTP [Status Codes](./StatusCodes.md).
These status codes indicate at a high level the kind of problem encountered. But
status codes alone may not convey enough information about an error to be helpful.

Robust and helpful APIs must provide enough pertinent information for a client
developer to understand and fix invalid request errors. Since consistency is key
to good API design, the same principle should be applied to the structures
providing problem details.

## Rules

The `data` field of the response object contains the business data of the
response. This field SHOULD be omitted if the response generates an error and no
business data.

### Problem Details

Errors and warnings must have a consistent structure across all Criteo APIs. The
`problemDetails` structure provides consistency in exchanging information about
problems encountered while processing a request from the client.

The `errors` field of the response object is an array of `problemDetails`
objects providing fine grained details to complement a `4xx` or `5xx` HTTP
status code. An example would be an error indicating the start date is after the
end date. If there are no errors in a response this field SHOULD be omitted.

The `warnings` field of the response object is an array of `problemDetails`
objects providing fine grained details explaining potential issues with the
request. For example when a query parameter is deprecated. If there are no
warnings in a response this field SHOULD be omitted.

The predefined fields in an `problemDetails` object are:

| Field      | Required | Type     |
| ---------- | -------- | -------- |
| traceId    | &check;  | string   |
| type       | &check;  | string   |
| code       | &check;  | string   |
| instance   | &check;  | string   |
| title      |          | string   |
| detail     |          | string   |
| source     |          | object   |
| stackTrace | &cross;  | string[] |

> &check; designates required object  
> &cross; designates forbidden object (for non-production use only)  
> (blank) designates optional object  

The `title` and `detail` fields SHOULD appear in every problem details object
because they provide the most help to the client side developer trying to fix a
`4xx` invalid request.

### Standard Fields

**_traceId_**

The machine readable correlation ID that is unique to each request.

**_type_**

A machine readable string specifying a unique predefined error category. These
guidelines define the [catalog of supported type values](../DomainModeling/CatalogOfErrorsAndWarningsTypeValues.md) and their semantics.

**_code_**

A machine readable error code string in kebab-case.
Unique across Criteo.

The same code (and same) error can be re-used across Criteo domains when is make sense.

**_instance_**

A machine readable URI reference that identifies the specific occurrence of the problem.
This could be useful when we want to the return the API endpoint identifying the exact resource related to the error. For example `/2020-10/cart`.

For Bulk Operation endpoints, this field allows to link the error/warning
with the associated sub-request via its content following the syntax `@data/<index>`
where `<index>` is the zero based index of the associated sub-request. For example
`@data/1`.

**_title_**

A short, HUMAN-READABLE summary of the problem type. It should not change from
occurrence to occurrence of the problem, except for purposes of localization.

**_detail_**

A HUMAN-READABLE detailed explanation specific to this occurrence of the problem.
This should not be more that 1 paragraph

**_source_**

A machine readable structure to reference to the exact location(s) causing the
error(s). Fields are machine readable keys. Values are references to the
'source'.

**_stackTrace_**

A HUMAN-READABLE stack trace produced by the implementation technology (e.g.
.Net, Scala, etc.)

Due to security considerations, we should not include Stack Traces as part of
the error response in a production environment. We should leverage extensibility
of the error structure to include Stack Traces only in Dev/Test environments to
help find problems and their locations quickly.

### Custom Fields

Additional custom fields MAY appear in the `problemDetails` object if needed.
These MUST use camel case. They MUST NOT override or duplicate standard fields.

### Exceptions

Authentication generally follows already established protocols. These protocols
have predefined unambiguous request/response structures. Therefore, they MAY NOT
use these error structures.

## Examples

> **Listing 1.** Generic body shape - Errors and Warnings

```javascript
{
    "data": {
    },
    "errors": [
        {
            "traceId": "56ed4096-f96a-4944-8881-05468efe0ec9",
            "type": "validation",
            "code": "target-bid-too-small",
            "instance": "/2020-10/campaigns/8343086999167541140",
            "title": "Target bid too small",
            "detail": "`targetBid` must meet `minBid` or the 0.3 platform limit",
            "source":
            {
                "targetBid": "data/2/attributes/targetBid"
            }
        }
    ],
    "warnings": [
        {
            "traceId": "56ed4096-f96a-4944-8881-05468efe0ec9",
            "type": "deprecation",
            "code": "endpoint-deprecated",
            "instance": "/2020-10/campaigns",
            "title": "Endpoint deprecated",
            "detail": "Endpoint `/2020-10/campaigns` is deprecated, please upgrade to `/2021-01/campaigns`"
        }
    ]
}
```


> **Listing 2.** Validation error example

```json
{
    "traceId": "56ed4096-f96a-4944-8881-05468efe0ec9",
    "type": "validation",
    "code": "not-enough-credit",
    "instance": "/2020-10/cart",
    "title": "You do not have enough credit",
    "detail": "Your current balance is 30, but that costs 50.",
    "source":
    {
        "products": "data/attributes/products/1"
    }
}
```

> **Listing 3.** Error with stack trace example

```json
{
    "traceId": "56ed4096-f96a-4944-8881-05468efe0ec9",
    "type": "validation",
    "code": "not-enough-credit",
    "instance": "@data/2",
    "title": "You do not have enough credit",
    "detail": "Your current balance is 30, but that costs 50.",
    "source":
    {
        "products": "data/2/attributes/products/1"
    },
    "stackTrace": [
        "at ConsoleApp1.SomeObject.OtherMethod() in C:\\ConsoleApp1\\SomeObject.cs:line 24",
        "at ConsoleApp1.SomeObject..ctor() in C:\\ConsoleApp1\\SomeObject.cs:line 14",
        "   --- End of inner exception stack trace ---",
        "at ConsoleApp1.SomeObject..ctor() in C:\\ConsoleApp1\\SomeObject.cs:line 18",
        "at ConsoleApp1.Program.DoSomething() in C:\\ConsoleApp1\\Program.cs:line 23",
        "at ConsoleApp1.Program.Main(String[] args) in C:\\ConsoleApp1\\Program.cs:line 13"
    ]
}
```

> **Listing 4.** Minimal error and warning response example

```http
HTTP/1.1 400 Invalid Request

{
    "errors": [
        {
            "traceId": "56ed4096-f96a-4944-8881-05468efe0ec9",
            "type": "validation",
            "code": "target-bid-too-small",
            "instance": "/2020-10/campaigns/8343086999167541140"
        }
    ],
    "warnings": [
        {
            "traceId": "56ed4096-f96a-4944-8881-05468efe0ec9",
            "type": "deprecation",
            "code": "endpoint-deprecated",
            "instance": "/2020-10/campaigns"
        }
    ]
}
```

## References

Error and/or Warning structure in
[Open API 2.0](/Guidelines/openApi2.0/ErrorsAndWarnings.yaml)/[Open API 3.0](/Guidelines/openApi3.0/ErrorsAndWarnings.yaml)


Valid OAS example 
```yaml
#👻-failures: 0 error-responses-should-be-in-json
#👻-failures: 0 error-responses-should-have-errors-and-warnings-array
#👻-failures: 0 error-response-should-contain-problem-details
openapi: 3.0.1
paths:
  /test:
    get:
      responses:
        200:
          description: OK
        404:
         description: Not found
         content:
           application/json:
            schema:
              type: object
              required: ["errors"]
              properties:
                errors: 
                  type: array
                  items:
                    $ref: '#/components/schemas/CommonProblem'
                warnings:
                  type: array
                  items:
                    $ref: '#/components/schemas/CommonProblem'
components:
  schemas:
    CommonProblem:
      type: object
      required: ["type", "code", "instance", "traceId"]
      properties:
        type:
          type: string
        code:
          type: string
        traceId:
          type: string
        instance:
          type: string
        title:
          type: string
```

Invalid example
```yaml
#👻-failures: 0 error-responses-should-be-in-json
openapi: 3.0.1
paths:
  /test:
    get:
      responses:
        200:
          description: OK
        404:
         description: Not found
         content:
           application/json:
            schema:
              type: object
              required: ["errors"]
              properties:
                unexpected: #👻-fails-here: error-responses-should-have-errors-and-warnings-array
                  type: string
                errors: 
                  type: array
                  items:
                    $ref: '#/components/schemas/CommonProblem'
                warnings:
                  type: array
                  items:
                    type: object
                    properties: #👻-fails-here: error-response-should-contain-problem-details
                      code:
                        type: string
components:
  schemas:
    CommonProblem:
      type: object
      required: ["type", "code", "instance", "traceId"]
      properties:
        type:
          type: string
        code:
          type: string
        traceId:
          type: string
        instance:
          type: string
        title: 
          type: number #👻-fails-here: error-response-should-contain-problem-details
```

```yaml
#👻-rule
error-responses-should-be-in-json:
  description: Error responses must return application/json
  given: "#responses-error"
  severity: error
  then:
    - field: content["application/json"]
      function: defined
    - field: content["application/json"].schema
      function: defined
```

```yaml
#👻-rule
error-responses-should-have-errors-and-warnings-array:
  description: Error responses should have errors and warnings arrays
  message: "{{description}}, {{error}}."
  given: "#responses-error.content[\"application/json\"].schema"
  severity: error
  then:
    - function: checkObjectProperties
      functionOptions:
        mandatoryProperties:
          - name: errors
            type: array
            required: true
        optionalProperties:
          - name: warnings
            type: array
          - name: metadata
          - name: data
        canHaveOtherProperties: false
    - function: matchExample
      functionOptions:
        match: true
        example:
          {
            "errors": [
                {
                    "traceId": "56ed4096-f96a-4944-8881-05468efe0ec9",
                    "type": "validation",
                    "code": "target-bid-too-small",
                    "instance": "/2020-10/campaigns/8343086999167541140",
                    "detail": "Something wrong happened"
                }
            ]
        }
```


```yaml
#👻-rule
error-response-should-contain-problem-details:
  description: Error responses errors/warning should be problem details
  message: "{{description}}, {{error}}."
  given: "#responses-error.content[\"application/json\"].schema.properties[errors,warnings].items"
  severity: error
  then:
    function: checkObjectProperties
    functionOptions:
      mandatoryProperties:
        - name: traceId
          type: string
        - name: instance
          type: string
        - name: code
          type: string
        - name: type
          type: string
      optionalProperties:
        - name: title
          type: string
        - name: detail
          type: string
        - name: source
          type: object
```