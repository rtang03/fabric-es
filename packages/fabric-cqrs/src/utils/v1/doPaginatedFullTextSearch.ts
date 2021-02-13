// import type { FTSearchParameters } from 'redis-modules-sdk';
// import type { Store } from 'redux';
// import type { Logger } from 'winston';
// import type { HandlerResponse, Paginated } from '../types';
// import { getPaginated } from './getPaginated';
// import { queryFTSGetPaginatedCommit } from './queryFTSGetPaginatedCommit';
//
// /**
//  * perform search
//  * @ignore
//  */
// export const doPaginatedFullTextSearch: <TResult = any>(
//   index: 'cidx' | 'eidx',
//   option: { store: Store; logger: Logger }
// ) => (
//   query: string,
//   param: FTSearchParameters
//   // cursor: number,
//   // pagesize: number
// ) => Promise<HandlerResponse<Paginated<TResult>>> = <TResult>(index, option) => async (
//   query,
//   param
//   // cursor,
//   // pagesize
// ) => {
//   const total = await queryFTSGetPaginatedCommit(index, option)({ query, cursor: 0, pagesize: 0 });
//
//   const paginated = await queryFTSGetPaginatedCommit(index, option)({ query, cursor, pagesize });
//
//   return total?.status !== 'OK'
//     ? { status: 'ERROR', error: total.error, message: total.message }
//     : paginated?.status !== 'OK'
//     ? { status: 'ERROR', error: paginated.error, message: paginated.message }
//     : {
//         status: 'OK',
//         data: getPaginated<TResult>(paginated.data, total.data, cursor),
//       };
// };
