import { buildTag, Status } from '..';
import { PO, PoEvents } from '.';

export const poReducer = (po: PO, event: PoEvents): PO => {
  switch (event.type) {
    case 'PoCreated':
      const {
        userId: uid0,
        // buyerName: buy0,
        // sellerName: sell0,
        // buyerBankName: bbnk0,
        incotermsCode: inco0,
        shipVia: svia0,
        // countryOfOrigin: orgn0,
        // goodsDescription: desc0,
        currency: curr0,
        settlementCurrency: scur0,
        ...rest0
      } = event.payload;
      return {
        id: rest0.poId,
        ownerId: uid0,
        status: Status.New,
        // buyerName: buy0,
        // sellerName: sell0,
        // buyerBankName: bbnk0,
        incotermsCode: inco0,
        shipVia: svia0,
        // countryOfOrigin: orgn0,
        // goodsDescription: desc0,
        currency: curr0,
        settlementCurrency: scur0,
        tag: buildTag(',', 'PO,Purchase Order', inco0, svia0, curr0, scur0), // .replace(REGEX, '\\$1')
        // desc: buildTag(' ', undefined, desc0),
        ...rest0
      };

    case 'PoUpdated':
      const {
        userId: uid1,
        // buyerName: buy1,
        // sellerName: sell1,
        // buyerBankName: bbnk1,
        incotermsCode: inco1,
        shipVia: svia1,
        // countryOfOrigin: orgn1,
        // goodsDescription: desc1,
        currency: curr1,
        settlementCurrency: scur1,
        poId: pid1,
        // attachmentList,
        ...rest1
      } = event.payload;
      // if (attachmentList) po.attachmentList.push(...attachmentList);

      if (!po) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${pid1}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...po,
        // buyerName: buy1,
        // sellerName: sell1,
        // buyerBankName: bbnk1,
        incotermsCode: inco1,
        shipVia: svia1,
        // countryOfOrigin: orgn1,
        // goodsDescription: desc1,
        currency: curr1,
        settlementCurrency: scur1,
        tag: buildTag(',', po.tag, inco1, svia1, curr1, scur1),
        // desc: buildTag(' ', po.desc, desc1),
        ...rest1,
        status: Status.Updated
      };

    case 'PoCancelled':
      const { userId: uid2, poId: pid2, timestamp } = event.payload;

      if (!po) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${pid2}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...po,
        timestamp,
        // reason,
        status: Status.Cancelled
      };

    case 'PoProcessed':
      const { userId: uid3, poId: pid3, actionResponse, ...rest3 } = event.payload;

      if (!po) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${pid3}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...po,
        // sellerBankName,
        // tag: buildTag(',', po.tag, sellerBankName),
        ...rest3,
        status: (actionResponse === '1') ? Status.Accepted : Status.Rejected
      };
  };
};