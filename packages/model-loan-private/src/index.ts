/**
 * **model-loan-private** is the private data portion of the domain model of a generic bank loan workflow processing.
 * Entities:
 *  > LoanDetails - Details information assoicate with an on-chain loan application entity.
 *  > DocContents - Content of a document associate with an on-chain document entity.
 *
 * NOTE!!! Unlike on-chain data, private data services are typically started within a single micro-service, thus there can only be
 * one set of GQL data graph defination (schema and resolvers).
 */

export * from './doc-contents';
export * from './loan-details';
