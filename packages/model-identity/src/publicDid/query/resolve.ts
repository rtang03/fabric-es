export const RESOLVE_DIDDOCUMENT = `
  query ResolveDidDocument($did: String!) {
    resolveDidDocument(did: $did) {
      context
      controller
      created
      id
      keyAgreement
      proof
      service
      verificationMethod
      updated
    }
  }
`;
