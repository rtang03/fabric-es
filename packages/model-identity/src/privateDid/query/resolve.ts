export const RESOLVE_DIDDOCUMENT = `
  query ResolveDidDocumentPrivate($did: String!) {
    resolveDidDocumentPrivate(did: $did) {
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
