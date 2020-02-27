import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { omit } from 'lodash';
import { serialize, splitKey } from '.';
import { Commit } from '..';

export class PrivateStateList {
  constructor(public ctx: Context, public name: string) {}

  async getQueryResult(collection: string, attributes: string[]) {
    // todo: this is workaround to known bug FAB-14216. This will not work after the bug is fixexd in V2.
    const iterator: Iterators.StateQueryIterator = await this.ctx.stub
      .getPrivateDataByPartialCompositeKey(collection, 'entities', attributes)
      .then((data: any) => data.iterator);
    const result: any = {};
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const commit = JSON.parse(value.value.toString('utf8'));
        result[commit.commitId] = omit(commit, 'key');
      }
      if (done) {
        await iterator.close();
        return Buffer.from(JSON.stringify(result));
      }
    }
  }

  async addState(collection: string, commit: Commit) {
    await this.ctx.stub.putPrivateData(
      collection,
      this.ctx.stub.createCompositeKey(this.name, splitKey(commit.key)),
      serialize(commit)
    );
  }

  async getState(collection: string, key: string): Promise<Commit> {
    const data = await this.ctx.stub.getPrivateData(
      collection,
      this.ctx.stub.createCompositeKey(this.name, splitKey(key))
    );
    if (data.toString()) {
      return JSON.parse(data.toString());
    } else return Object.assign({});
  }

  async deleteState(collection: string, { key }: Commit) {
    await this.ctx.stub.deletePrivateData(collection, this.ctx.stub.createCompositeKey(this.name, splitKey(key)));
  }
}
