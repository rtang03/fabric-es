export const QUERY: Record<string, {
  name: string;
  query: string;
  parser: (input: any) => any;
}> = {
'FullTextSearchEntity': {
name: 'fullTextSearchEntity',
query: `
query FullTextSearchEntity($query: String!) {
  fullTextSearchEntity (query: $query) {
    items {
      id
      entityName
      value
      events
      desc
      tag
      creator
      timeline
    }
  }
}`,
parser: (input: any) => {
  if (input['fullTextSearchEntity'] && input['fullTextSearchEntity'].items && Array.isArray(input['fullTextSearchEntity'].items)) {
    return input['fullTextSearchEntity'].items.map(i => {
      if (i.id && i.entityName && i.value) {
        try {
          const v = JSON.parse(i.value);
          const { poId, invoiceId, status, currency, settlementCurrency, settlementAmount, timestamp, ...rest } = v;
          return {
            id: i.id, entity: i.entityName,
            poId, invoiceId, status, currency, settlementCurrency, settlementAmount, timestamp
          };
        } catch (error) {
          return {
            id: i.id, entity: i.entityName, error
          };
        }
      } else {
        return {
          error: 'Unsupported query response format'
        };
      }
    });
  } else {
    return input;
  }
},
},
'FullTextSearchCommit': {
name: 'fullTextSearchCommit',
query: `
query FullTextSearchCommit($query: String!) {
  fullTextSearchCommit (query: $query) {
    items {
      id
      mspId
      eventsString
    }
  }
}`,
parser: (input: any) => input},
};