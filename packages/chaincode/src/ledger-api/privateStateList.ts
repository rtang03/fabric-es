import util from 'util';
import { Context } from 'fabric-contract-api';
import { omit } from 'lodash';
import { serialize, splitKey } from '.';
import { Commit } from '..';

export class PrivateStateList {
  constructor(public ctx: Context, public name: string) {}

  async getQueryResult(collection: string, attributes: string[]) {
    const promises = this.ctx.stub.getPrivateDataByPartialCompositeKey(collection, 'entities', attributes);
    const result: any = {};

    try {
      for await (const res of promises) {
        const commit = JSON.parse(res.value.toString());
        result[commit.commitId] = omit(commit, 'key');
      }
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to getQueryResult, %j', e));
    }

    return Buffer.from(JSON.stringify(result));
  }

  async addState(collection: string, commit: Commit) {
    await this.ctx.stub.putPrivateData(
      collection,
      this.ctx.stub.createCompositeKey(this.name, splitKey(commit.key)),
      serialize(commit)
    );
  }

  async getState(collection: string, key: string): Promise<Commit> {
    let result;

    const data = await this.ctx.stub.getPrivateData(
      collection,
      this.ctx.stub.createCompositeKey(this.name, splitKey(key))
    );

    try {
      result = data.toString() ? JSON.parse(data.toString()) : Object.assign({});
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to parse data, %j', e));
    }

    return result;
  }

  async deleteState(collection: string, { key }: Commit) {
    await this.ctx.stub.deletePrivateData(collection, this.ctx.stub.createCompositeKey(this.name, splitKey(key)));
  }
}
